import { Injectable, Logger } from '@nestjs/common';
import { By, ThenableWebDriver, WebElement } from 'selenium-webdriver';
import { Car } from '../../../car/car.entity';
import {
  City,
  Condition,
  Drive,
  EngineType,
  Platform,
  Seller,
  Transmission,
  Wheel,
} from '../../../common';
import * as urlLib from 'url';
import * as numParse from 'num-parse';
import { sleep } from 'src/helpers';

@Injectable()
export class AvitoParserService {
  private readonly logger = new Logger(AvitoParserService.name);

  public async parsePage(
    driver: ThenableWebDriver,
    city: City,
    lastProcessedCars: Car[],
    url: string,
    page: number,
  ): Promise<{ cars: Car[]; isLastPage: boolean }> {
    const cars: Car[] = [];
    let isLastPage: boolean = false;
    const pageUrl = new urlLib.URL(url);
    pageUrl.searchParams.append('p', String(page));

    this.logger.debug(`Parsing page ${page} url ${pageUrl.toString()}`);

    await driver.get(pageUrl.toString());
    const originalWindow = await driver.getWindowHandle();
    const avitoCarsElements = await driver.findElements(
      By.css('div[data-marker="item"]'),
    );

    this.logger.debug(
      `Page ${page} found ${avitoCarsElements.length} cars city ${city}`,
    );

    if (!avitoCarsElements.length) {
      return {
        cars: [],
        isLastPage: true,
      };
    }

    for (const avitoCarElement of avitoCarsElements) {
      try {
        const car = await this.getCarInfo(
          driver,
          originalWindow,
          avitoCarElement,
          city,
        );
        this.logger.debug(`Found car for city ${city} page ${page}`, {
          car,
        });

        if (!car) {
          continue;
        }

        this.logger.debug(`Page ${page} city ${city}`, {
          car,
          lastProcessedCars,
        });

        if (lastProcessedCars.length) {
          const lastProcessedCarIds = lastProcessedCars.map(
            (lastProcessedCar) => lastProcessedCar.url,
          );
          const currentCarId = car.url;

          const currentCarIdExists = lastProcessedCarIds.some(
            (lastProcessedCarId) => lastProcessedCarId === currentCarId,
          );
          this.logger.debug(
            `Last cars processed ids: ${lastProcessedCarIds.join(
              ', ',
            )}, current car id: ${currentCarId}`,
            { currentCarIdExists },
          );
          if (currentCarIdExists) {
            isLastPage = true;
            break;
          }
        }

        const date = new Date();
        date.setMinutes(date.getMinutes() - 5);
        if (car.postedAt && car.postedAt < date) {
          isLastPage = true;
          break;
        }

        cars.push(car);
      } catch (err) {
        this.logger.error(
          `Unable to get car info. City ${city}, page ${page}`,
          err,
        );
      }
    }

    return {
      cars,
      isLastPage,
    };
  }

  private async getCarInfo(
    driver: ThenableWebDriver,
    originalWindow: string,
    carElement: WebElement,
    city: City,
  ): Promise<Car | undefined> {
    const url = await this.getUrl(carElement);
    if (!url) {
      return undefined;
    }

    const price = await this.getPrice(carElement);
    const postUpdatedAt = await this.getPostUpdatedAt(carElement);

    this.logger.debug(
      `Car url ${url} price ${price} updatedAt ${postUpdatedAt}`,
    );

    await driver.switchTo().newWindow('tab');
    await driver.get(url);

    const imageUrl = await this.getImage(driver);
    const [brand, model] = await this.getBrandAndModel(driver);
    const postedAt = await this.getPostTimestamp(driver);
    const seller = await this.getSellerType(driver);
    const newAdd = this.isNewAdd(postedAt, postUpdatedAt);

    const carCharacteristicsElement = await driver.findElement(
      By.css('div[data-marker="item-view/item-params"]'),
    );

    const carCharacteristicsListElement =
      await carCharacteristicsElement.findElements(By.tagName('li'));

    let back: string = '';
    let phone: string = 'UNKNOWN';
    let year: number = 2100;
    let color: string = 'Черный';
    let millage: number = 0;
    let ownersCount: number = 1;
    let condition: Condition = Condition.hit;
    let engineVolume: number = 0;
    let enginePower: number = 0;
    let engineType: EngineType = EngineType.disel;
    let transmission: Transmission = Transmission.mechanic;
    let drive: Drive = Drive.back;
    let wheel: Wheel = Wheel.left;
    let costDifference: number = 0;

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
          color = characteristicValue;
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
          back = characteristicValue;
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

    await driver.close();
    await driver.switchTo().window(originalWindow);

    return {
      back,
      brand,
      city,
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
      newAdd,
      ownersCount,
      phone,
      platform: Platform.avito,
      postedAt: newAdd ? postedAt : postUpdatedAt,
      price,
      seller,
      transmission,
      url,
      wheel,
      year,
    };
  }

  private isNewAdd(postedAt: Date, updatedAt: Date): boolean {
    const daysDiff = updatedAt.getDate() - postedAt.getDate();
    const hoursdiff = updatedAt.getHours() - postedAt.getHours();
    const minutesDiff = updatedAt.getMinutes() - postedAt.getMinutes();

    if (daysDiff) {
      return false;
    }

    if (hoursdiff) {
      return false;
    }

    if (minutesDiff >= 10 || minutesDiff <= -10) {
      return false;
    }

    return true;
  }

  private async getPostUpdatedAt(carElement: WebElement): Promise<Date | null> {
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

      return null;
    } catch (err) {
      return null;
    }
  }

  private async getPrice(carElement: WebElement): Promise<number> {
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
      return null;
    }
  }

  private async getUrl(carElement: WebElement): Promise<string> {
    try {
      const url = await carElement
        .findElement(By.css('a[itemprop="url"]'))
        .getAttribute('href');
      return url;
    } catch (err) {
      this.logger.error('Unable to get url', err);
      return '';
    }
  }

  private async getImage(driver: ThenableWebDriver): Promise<string> {
    try {
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
}
