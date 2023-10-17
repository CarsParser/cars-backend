import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as seleniumWebdriver from 'selenium-webdriver';
import { By, ThenableWebDriver, WebElement, until } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as proxy from 'selenium-webdriver/proxy';
import { CarRepository } from 'src/car/car.repository';
import {
  BackType,
  City,
  Color,
  Condition,
  Drive,
  EngineType,
  Platform,
  Seller,
  Transmission,
  Wheel,
} from 'src/common';
import { Proxy, ProxyRepository } from 'src/proxy/proxy.repository';
import * as urlLib from 'node:url';
import { ElkLogger, sleep } from 'src/helpers';
import { Car } from 'src/car/car.entity';
import { subMinutes } from 'date-fns';
import * as numParse from 'num-parse';
import * as Tesseract from 'tesseract.js';
import { ProviderRepository } from '../provider.repository';
import { LogLevel } from 'src/helpers/logger';
import * as UserAgent from 'user-agents';

const ua = new UserAgent();

interface AvitoPartialCar {
  url: string;
  price: number;
  postUpdatedAt: Date;
  city: City;
  newAdd: boolean;
}

@Injectable()
export class AvitoRepository implements ProviderRepository {
  private avitoCityMapper: { [key in City]: string } = {
    [City.spb]: 'sankt_peterburg_i_lo',
    [City.msk]: 'moskva_i_mo',
    [City.arkh]: 'arhangelskaya_oblast',
    [City.ekb]: 'sverdlovskaya_oblast',
    [City.kazan]: 'tatarstan',
    [City.omsk]: 'omskaya_oblast',
    [City.rostov]: 'rostovskaya_oblast',
    [City.samara]: 'samarskaya_oblast',
  };

  constructor(
    private configService: ConfigService,
    private proxyRepository: ProxyRepository,
    private carRepository: CarRepository,
    private elkLogger: ElkLogger,
  ) {}

  async loadCars(city: City) {
    const fullCarsLoadStart = performance.now();
    let proxy: Proxy | undefined = await this.proxyRepository.get();
    this.elkLogger.log(AvitoRepository.name, 'loading cars', { city, proxy });

    const initDriverStart = performance.now();
    const driver = this.initDriver(proxy);
    const initDriverStop = performance.now();
    const initDriverInSeconds = (initDriverStop - initDriverStart) / 1000;
    const roundedInitDriverTime = Number(initDriverInSeconds).toFixed(3);
    this.elkLogger.log(
      AvitoRepository.name,
      `init driver took ${roundedInitDriverTime}s`,
      { time: roundedInitDriverTime },
      LogLevel.LOW,
    );

    try {
      const partialCarLoadStart = performance.now();
      const partialCars = await this.getPartialCars(driver, city);
      const partialCarLoadStop = performance.now();
      const partialCarLoadInSeconds =
        (partialCarLoadStop - partialCarLoadStart) / 1000;
      const roundedPartialCarLoadTime = Number(partialCarLoadInSeconds).toFixed(
        3,
      );
      this.elkLogger.log(
        AvitoRepository.name,
        `partial car load took ${roundedPartialCarLoadTime}s`,
        { time: roundedPartialCarLoadTime },
        LogLevel.LOW,
      );
      const partialCarsReverseOrder = partialCars.sort((a, b) => {
        return a.postUpdatedAt.getTime() - b.postUpdatedAt.getTime();
      });
      this.elkLogger.log(AvitoRepository.name, 'found partial cars', {
        partialCarsReverseOrder,
      });
      const originalWindow = await driver.getWindowHandle();

      for (const partialCar of partialCarsReverseOrder) {
        const fullCarLoadStart = performance.now();
        const car = await this.getFullCarInfo(
          driver,
          partialCar,
          originalWindow,
        );
        const fullCarLoadStop = performance.now();
        const fullCarLoadInSeconds =
          (fullCarLoadStop - fullCarLoadStart) / 1000;
        const roundedFullCarLoadTime = Number(fullCarLoadInSeconds).toFixed(3);
        this.elkLogger.log(
          AvitoRepository.name,
          `full car load took ${roundedFullCarLoadTime}s`,
          { time: roundedFullCarLoadTime },
          LogLevel.LOW,
        );
        this.elkLogger.log(AvitoRepository.name, 'loaded car', { car });
        await this.carRepository.save([car]);
      }
    } catch (err) {
      this.elkLogger.error(
        AvitoRepository.name,
        'unable to load car',
        err,
        LogLevel.HIGH,
      );
      throw err;
    } finally {
      if (proxy) {
        this.elkLogger.log(AvitoRepository.name, 'adding proxy back', proxy);
        await this.proxyRepository.add(proxy);
      }

      await driver?.close();
      const fullCarsLoadStop = performance.now();
      const fullCarsLoadInSeconds =
        (fullCarsLoadStop - fullCarsLoadStart) / 1000;
      const roundedFullCarsLoadTime = Number(fullCarsLoadInSeconds).toFixed(3);
      this.elkLogger.log(
        AvitoRepository.name,
        `full cars load took ${roundedFullCarsLoadTime}s`,
        { time: roundedFullCarsLoadTime },
        LogLevel.LOW,
      );
    }
  }

  private async isNewAdd(carElement: WebElement): Promise<boolean> {
    try {
      await carElement.findElement(By.className('styles-redesign-YLctS'));

      return false;
    } catch (_) {
      return true;
    }
  }

  private async getBrandAndModel(
    driver: ThenableWebDriver,
  ): Promise<[string, string]> {
    try {
      const navigationElement = await driver.findElement(
        By.css('div[data-marker="item-navigation"]'),
      );
      const navigationDescriptionElements =
        await navigationElement.findElements(
          By.css('span[itemprop="itemListElement"]'),
        );
      const brand = await navigationDescriptionElements[4].getText();
      const model = await navigationDescriptionElements[5].getText();

      return [brand, model];
    } catch (err) {
      return ['', ''];
    }
  }

  private async getSellerType(driver: ThenableWebDriver): Promise<Seller> {
    try {
      const sellerInfo = await driver
        .findElement(By.css('div[data-marker="seller-info/label"]'))
        .getText();

      switch (sellerInfo) {
        case 'Частное лицо': {
          return Seller.private;
        }
        case 'Автодилер': {
          return Seller.dealer;
        }
        default: {
          return Seller.dealer;
        }
      }
    } catch (err) {
      try {
        const sellerInfo = await driver
          .findElement(By.css('div[data-marker="seller-info/name"]'))
          .getText();
        if (sellerInfo.includes('Официальный дилер')) {
          return Seller.dealer;
        } else {
          return Seller.dealer;
        }
      } catch (err) {
        return Seller.dealer;
      }
    }
  }

  private async getPostTimestamp(
    driver: ThenableWebDriver,
  ): Promise<Date | null> {
    try {
      const postedAtString = await driver
        .findElement(By.css('span[data-marker="item-view/item-date"]'))
        .getText();

      let postTimestamp: Date | null = null;
      if (postedAtString.includes('сегодня')) {
        postTimestamp = new Date();
        const hourAndMinute = postedAtString.match(/\d+:\d+/g);
        const [hour, minute] = hourAndMinute[0].split(':');
        postTimestamp.setHours(+hour, +minute, 0, 0);
      } else if (postedAtString.includes('вчера')) {
        postTimestamp = new Date();
        const hourAndMinute = postedAtString.match(/\d+:\d+/g);
        const [hour, minute] = hourAndMinute[0].split(':');
        postTimestamp.setHours(+hour, +minute, 0, 0);
        postTimestamp.setDate(postTimestamp.getDate() - 1);
      } else {
        postTimestamp = new Date();
        const day = +postedAtString.match(/\d+/)[0];

        let month: number = 0;

        if (postedAtString.includes('января')) {
          month = 1;
        } else if (postedAtString.includes('февраля')) {
          month = 2;
        } else if (postedAtString.includes('марта')) {
          month = 3;
        } else if (postedAtString.includes('апреля')) {
          month = 4;
        } else if (postedAtString.includes('мая')) {
          month = 5;
        } else if (postedAtString.includes('июня')) {
          month = 6;
        } else if (postedAtString.includes('июля')) {
          month = 7;
        } else if (postedAtString.includes('августа')) {
          month = 8;
        } else if (postedAtString.includes('сентября')) {
          month = 9;
        } else if (postedAtString.includes('октября')) {
          month = 10;
        } else if (postedAtString.includes('ноября')) {
          month = 11;
        } else if (postedAtString.includes('декабря')) {
          month = 12;
        }

        const hourAndMinute = postedAtString.match(/\d+:\d+/g);
        const [hour, minute] = hourAndMinute[0].split(':');

        postTimestamp.setMonth(month - 1);
        postTimestamp.setDate(day);
        postTimestamp.setHours(+hour, +minute, 0, 0);
      }

      return postTimestamp;
    } catch (err) {
      return new Date();
    }
  }

  private async getImage(driver: ThenableWebDriver): Promise<string> {
    try {
      await driver.wait(
        until.elementLocated(By.css('div[data-marker="item-view/gallery"]')),
        10_000,
      );
      const galeryElement = await driver.findElement(
        By.css('div[data-marker="item-view/gallery"]'),
      );
      const image = await galeryElement
        .findElement(By.tagName('img'))
        .getAttribute('src');

      return image;
    } catch (err) {
      return 'https://avito.ru';
    }
  }

  private async getCostDifference(
    driver: ThenableWebDriver,
    price: number,
  ): Promise<number> {
    try {
      const lowestPrice = await driver
        .findElement(
          By.css('span[class="styles-subtitle-_GzPh desktop-1760830"]'),
        )
        .getText();
      this.elkLogger.log(AvitoRepository.name, 'lowest Price', {
        lowestPrice: numParse(lowestPrice.replace(/ /g, '')),
      });
      return price - numParse(lowestPrice.replace(/ /g, ''));
    } catch (err) {
      this.elkLogger.error(
        AvitoRepository.name,
        'unable to get cost difference',
        err,
        LogLevel.LOW,
      );
    }
    return 0;
  }

  private async getPhoneNumber(driver: ThenableWebDriver): Promise<string> {
    try {
      const button = await driver.findElement(
        By.css('button[data-marker="item-phone-button/card"]'),
      );
      await button.click();
      await driver.wait(
        until.elementLocated(
          By.css('img[data-marker="phone-popup/phone-image"]'),
        ),
        15_000,
      );
      const numberPict = await driver
        .findElement(By.css('img[data-marker="phone-popup/phone-image"]'))
        .getAttribute('src');
      const {
        data: { text },
      } = await Tesseract.recognize(numberPict, 'eng', {
        logger: (m) =>
          this.elkLogger.log(
            AvitoRepository.name,
            'parse phone',
            { m },
            LogLevel.LOW,
          ),
      });
      const numberString = text.replace('\n', '');
      this.elkLogger.log(
        AvitoRepository.name,
        'phone number string',
        { numberString },
        LogLevel.LOW,
      );
      return numberString;
    } catch (err) {
      this.elkLogger.error(
        AvitoRepository.name,
        'unable to get phone number',
        err,
        LogLevel.LOW,
      );

      return 'UNKNOWN';
    }
  }

  private async getFullCarInfo(
    driver: ThenableWebDriver,
    partialCar: AvitoPartialCar,
    originalWindow: string,
  ): Promise<Car> {
    this.elkLogger.log(
      AvitoRepository.name,
      'getting full car info',
      partialCar,
    );

    await driver.switchTo().newWindow('tab');
    await this.getPage(driver, partialCar.url);

    const imageUrl = await this.getImage(driver);
    const [brand, model] = await this.getBrandAndModel(driver);
    //const postedAt = await this.getPostTimestamp(driver);
    const seller = await this.getSellerType(driver);
    const costDifference = await this.getCostDifference(
      driver,
      partialCar.price,
    );

    const carCharacteristicsElement = await driver.findElement(
      By.css('div[data-marker="item-view/item-params"]'),
    );

    const carCharacteristicsListElement =
      await carCharacteristicsElement.findElements(By.tagName('li'));

    let back: BackType = BackType.sedan;
    let year: number = 2100;
    let color: Color = Color.red;
    let millage: number = 0;
    let ownersCount: number = 1;
    let condition: Condition = Condition.hit;
    let engineVolume: number = 0;
    let enginePower: number = 0;
    let engineType: EngineType = EngineType.disel;
    let transmission: Transmission = Transmission.mechanic;
    let drive: Drive = Drive.back;
    let wheel: Wheel = Wheel.left;

    for (const carCharacteristicElement of carCharacteristicsListElement) {
      const [characteristicName, characteristicValue] = (
        await carCharacteristicElement.getText()
      ).split(': ');

      switch (characteristicName) {
        case 'Год выпуска': {
          try {
            year = numParse(characteristicValue);
          } catch (err) {}
          break;
        }
        case 'Цвет': {
          switch (characteristicValue) {
            case 'Красный': {
              color = Color.red;
              break;
            }
            case 'Белый': {
              color = Color.white;
              break;
            }
            case 'Серебряный': {
              color = Color.silver;
              break;
            }
            case 'Серый': {
              color = Color.gray;
              break;
            }
            case 'Чёрный': {
              color = Color.black;
              break;
            }
            case 'Коричневый': {
              color = Color.brown;
              break;
            }
            case 'Золотой': {
              color = Color.gold;
              break;
            }
            case 'Бежевый': {
              color = Color.beige;
              break;
            }
            case 'Бордовый': {
              color = Color.vinous;
              break;
            }
            case 'Оранжевый': {
              color = Color.orange;
              break;
            }
            case 'Жёлтый': {
              color = Color.yellow;
              break;
            }
            case 'Зелёный': {
              color = Color.green;
              break;
            }
            case 'Голубой': {
              color = Color.lightBlue;
              break;
            }
            case 'Синий': {
              color = Color.blue;
              break;
            }
            case 'Фиолетовый': {
              color = Color.violet;
              break;
            }
            case 'Пурпурный': {
              color = Color.purple;
              break;
            }
            case 'Розовый': {
              color = Color.pink;
              break;
            }
          }
          break;
        }
        case 'Пробег': {
          try {
            millage = numParse(characteristicValue);
          } catch (err) {}
          break;
        }
        case 'Владельцев по ПТС': {
          try {
            ownersCount = numParse(characteristicValue);
          } catch (err) {}
          break;
        }
        case 'Состояние': {
          switch (characteristicValue) {
            case 'Не битый': {
              condition = Condition.notHit;
              break;
            }
            case 'Битый': {
              condition = Condition.hit;
              break;
            }
          }
          break;
        }
        case 'Модификация': {
          try {
            const powerString = characteristicValue.split('(')[1];
            enginePower = numParse(powerString);
          } catch (err) {}
          break;
        }
        case 'Объём двигателя': {
          try {
            engineVolume = numParse(characteristicValue);
          } catch (err) {}
          break;
        }
        case 'Тип двигателя': {
          switch (characteristicValue) {
            case 'Бензин': {
              engineType = EngineType.petrol;
              break;
            }
            case 'Дизель': {
              engineType = EngineType.disel;
              break;
            }
            case 'Гибрид': {
              engineType = EngineType.hybrid;
              break;
            }
            case 'Электро': {
              engineType = EngineType.electric;
              break;
            }
          }
          break;
        }
        case 'Коробка передач': {
          switch (characteristicValue) {
            case 'Робот': {
              transmission = Transmission.robot;
              break;
            }
            case 'Механика': {
              transmission = Transmission.mechanic;
              break;
            }
            case 'Автомат': {
              transmission = Transmission.auto;
              break;
            }
            case 'Вариатор': {
              transmission = Transmission.vary;
              break;
            }
          }
          break;
        }
        case 'Привод': {
          switch (characteristicValue) {
            case 'Передний': {
              drive = Drive.front;
              break;
            }
            case 'Задний': {
              drive = Drive.back;
              break;
            }
            case 'Полный': {
              drive = Drive.full;
              break;
            }
          }
          break;
        }
        case 'Тип кузова': {
          switch (characteristicValue) {
            case 'Седан': {
              back = BackType.sedan;
              break;
            }
            case 'Внедорожник 3-дверный': {
              back = BackType.offroadThreeDoors;
              break;
            }
            case 'Внедорожник 5-дверный': {
              back = BackType.offroadFiveDoors;
              break;
            }
            case 'Универсал': {
              back = BackType.universal;
              break;
            }
            case 'Хетчбек 3-дверный': {
              back = BackType.hatchbackThreeDoors;
              break;
            }
            case 'Хетчбек 5-дверный': {
              back = BackType.hatchbackFiveDoors;
              break;
            }
            case 'Купе': {
              back = BackType.coupe;
              break;
            }
            case 'Минивэн': {
              back = BackType.minivan;
              break;
            }
            case 'Микроавтобус': {
              back = BackType.minibus;
              break;
            }
            case 'Лифтбек': {
              back = BackType.liftback;
              break;
            }
            case 'Пикап': {
              back = BackType.pickup;
              break;
            }
            case 'Фургон': {
              back = BackType.van;
              break;
            }
            case 'Кабриолет': {
              back = BackType.cabrio;
              break;
            }
          }
          break;
        }
        case 'Руль': {
          switch (characteristicValue) {
            case 'Левый': {
              wheel = Wheel.left;
              break;
            }
            case 'Правый': {
              wheel = Wheel.right;
              break;
            }
          }
          break;
        }
      }
    }

    let phone: string = 'UNKNOWN';
    if (!this.configService.get('SKIP_PHONE_NUMBER')) {
      phone = await this.getPhoneNumber(driver);
    }

    await driver.close();
    await driver.switchTo().window(originalWindow);

    return {
      back,
      brand,
      city: partialCar.city,
      color,
      condition,
      costDifference,
      drive,
      enginePower,
      engineType,
      engineVolume,
      imageUrl,
      mileage: millage,
      model,
      newAdd: partialCar.newAdd,
      ownersCount,
      phone,
      platform: Platform.avito,
      postedAt: partialCar.postUpdatedAt,
      price: partialCar.price,
      seller,
      transmission,
      url: partialCar.url,
      wheel,
      year,
    };
  }

  private async getPartialCars(
    driver: ThenableWebDriver,
    city: City,
  ): Promise<AvitoPartialCar[]> {
    const lastProcessedCars = await this.carRepository.findLastProcessedCars(
      city,
      Platform.avito,
    );
    const partialCars: AvitoPartialCar[] = [];
    for (let page = 1; page <= 100; page++) {
      const pageUrl = this.getUrl(city, page);
      await this.getPage(driver, pageUrl);
      await driver.wait(
        until.elementLocated(By.css('div[data-marker="item"]')),
        15_000,
      );
      const carElements = await driver.findElements(
        By.css('div[data-marker="item"]'),
      );

      if (!carElements.length) {
        return partialCars;
      }

      for (const carElement of carElements) {
        const url = await this.getCarUrl(carElement);
        if (!url) {
          return partialCars;
        }
        const price = await this.getCarPrice(carElement);
        const postUpdatedAt = await this.getCarPostUpdatedAt(carElement);
        const newAdd = await this.isNewAdd(carElement);
        const newPartialCar = { url, price, postUpdatedAt, city, newAdd };

        if (!this.isNewCar(lastProcessedCars, newPartialCar)) {
          return partialCars;
        }

        partialCars.push(newPartialCar);
      }
    }
  }

  private isNewCar(
    lastProcessedCars: Pick<Car, 'postedAt' | 'url'>[],
    car: AvitoPartialCar,
  ): boolean {
    if (lastProcessedCars.length) {
      const lastProcessedCarIds = lastProcessedCars.map(
        (lastProcessedCar) => lastProcessedCar.url,
      );
      const currentCarId = car.url;

      const currentCarIdExists = lastProcessedCarIds.some(
        (lastProcessedCarId) => lastProcessedCarId === currentCarId,
      );
      this.elkLogger.log(AvitoRepository.name, 'current car exists', {
        lastProcessedCarIds,
        currentCarId,
        currentCarIdExists,
      });
      if (currentCarIdExists) {
        return false;
      }
    }

    if (car.postUpdatedAt && car.postUpdatedAt < subMinutes(new Date(), 2)) {
      return false;
    }

    return true;
  }

  private async getCarPostUpdatedAt(carElement: WebElement): Promise<Date> {
    try {
      const updatedAtString = await carElement
        .findElement(By.css('p[data-marker="item-date"]'))
        .getText();

      if (updatedAtString.includes('секунд')) {
        const date = new Date();
        date.setSeconds(0, 0);

        return date;
      }

      const num = +updatedAtString.match(/\d+/)[0];

      if (updatedAtString.includes('минут')) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - num, 0, 0);

        return date;
      } else if (updatedAtString.includes('час')) {
        const date = new Date();
        date.setHours(date.getHours() - num, 0, 0, 0);

        return date;
      } else if (
        updatedAtString.includes('день') ||
        updatedAtString.includes('дней')
      ) {
        const date = new Date();
        date.setDate(date.getDate() - num);
        date.setHours(0, 0, 0, 0);

        return date;
      }

      return new Date();
    } catch (err) {
      return new Date();
    }
  }

  private async getCarPrice(carElement: WebElement): Promise<number> {
    try {
      const priceElement = await carElement.findElement(
        By.css('p[data-marker="item-price"]'),
      );
      const price = await priceElement
        .findElement(By.css('meta[itemprop="price"]'))
        .getAttribute('content');

      return +price || 0;
    } catch (err) {
      return 0;
    }
  }

  private async getCarUrl(carElement: WebElement): Promise<string> {
    try {
      const url = await carElement
        .findElement(By.css('a[itemprop="url"]'))
        .getAttribute('href');
      return url;
    } catch (err) {
      this.elkLogger.error(
        AvitoRepository.name,
        'unable to get car url',
        err,
        LogLevel.HIGH,
      );
      return '';
    }
  }

  private async getPage(driver: ThenableWebDriver, url: string) {
    await driver.get(url);
    const isBlocked = await this.isBlocked(driver);

    if (isBlocked) {
      this.elkLogger.error(
        AvitoRepository.name,
        'page blocked',
        { url },
        LogLevel.HIGH,
      );
      await sleep(10_000);

      await driver.close();
      await driver.switchTo().newWindow('window');
    }
  }

  private async isBlocked(driver: ThenableWebDriver): Promise<boolean> {
    const title = await driver.getTitle();
    this.elkLogger.log(AvitoRepository.name, 'page title', { title });

    if (title.toLocaleLowerCase().includes('доступ ограничен')) {
      return true;
    }

    return false;
  }

  private getUrl(city: City, page: number): string {
    const avitoCity = this.avitoCityMapper[city];
    const url = new urlLib.URL(`https://www.avito.ru/${avitoCity}/avtomobili`);
    url.searchParams.append('cd', '1');
    url.searchParams.append('s', '104');
    url.searchParams.append('localPriority', '1');
    url.searchParams.append('p', String(page));

    return url.toString();
  }

  private initDriver(proxyObject?: Proxy): ThenableWebDriver {
    const capabilities = seleniumWebdriver.Capabilities.chrome();
    const options = new chrome.Options()
      //.headless()
      .addArguments(
        '--no-sandbox',
        'start-maximized',
        '--disable-blink-features=AutomationControlled',
        `user-agent=${ua.toString()}`,
      );

    // Init driver
    const chromeServerHost = this.configService.get('CHROME_HOST');
    const chromeServerPort = this.configService.get('CHROME_PORT');
    const driverBuilder = new seleniumWebdriver.Builder()
      .forBrowser('chrome')
      .usingServer(`http://${chromeServerHost}:${chromeServerPort}/wd/hub`)
      .withCapabilities(capabilities)
      .setChromeOptions(options);

    // Settinig proxy if exists
    if (proxyObject) {
      let httpProxy = `${proxyObject.host}:${proxyObject.port}`;

      if (proxyObject.auth) {
        httpProxy = `${proxyObject.auth.user}:${proxyObject.auth.password}@${httpProxy}`;
      }

      driverBuilder.setProxy(proxy.manual({ http: httpProxy }));
    }

    return driverBuilder.build();
  }
}
