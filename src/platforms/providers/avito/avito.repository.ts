import { Injectable, Logger } from '@nestjs/common';
import { City, SearchCarsData } from 'src/common';
import { FindResponse, ProviderRepository } from '../provider.repository';
import { ProxyRepository } from 'src/proxy/proxy.repository';
import { Car } from 'src/car/car.entity';
import * as seleniumWebdriver from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as urlLib from 'url';
import { AvitoParserService } from './avito.parse.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AvitoRepository extends ProviderRepository {
  private avitoCityMapper: { [key in City]: string } = {
    [City.spb]: 'sankt_peterburg_i_lo',
    // [City.msk]: 'moskva',
    // [City.arkh]: '',
    // [City.ekb]: '',
    // [City.kazan]: '',
    // [City.omsk]: '',
    // [City.rostov]: '',
    // [City.samara]: '',
  };

  private readonly logger = new Logger(AvitoRepository.name);

  constructor(
    private readonly proxyRepository: ProxyRepository,
    private readonly avitoParserService: AvitoParserService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async find(params: SearchCarsData): Promise<FindResponse> {
    this.logger.debug(
      `Searching cars for city ${params.city} platform ${params.platform}`,
      { lastProcessedCars: params.lastProcessedCars },
    );
    // Get avito city name
    const avitoCity = this.avitoCityMapper[params.city];

    // Construct avito url
    const url = new urlLib.URL(`https://www.avito.ru/${avitoCity}/avtomobili`);
    url.searchParams.append('cd', '1');
    url.searchParams.append('s', '104');
    url.searchParams.append('localPriority', '1');

    const capabilities = seleniumWebdriver.Capabilities.chrome();
    const options = new chrome.Options().headless();

    // Init driver
    const chromeServerHost = this.configService.get('CHROME_HOST');
    const chromeServerPort = this.configService.get('CHROME_PORT');
    const driver = new seleniumWebdriver.Builder()
      .forBrowser('chrome')
      .usingServer(`http://${chromeServerHost}:${chromeServerPort}/wd/hub`)
      .withCapabilities(capabilities)
      .setChromeOptions(options)
      .build();

    // Found cars
    const cars: Car[] = [];

    try {
      // Parse page to page to get all new cars
      for (let page = 1; page <= 100; page++) {
        try {
          this.logger.debug(
            `Processing page ${page} for city ${params.city} platform ${params.platform}`,
          );

          // Get cars on page and flag if it is last page to search
          const { cars: pageCars, isLastPage } =
            await this.avitoParserService.parsePage(
              driver,
              params.city,
              params.lastProcessedCars,
              url.toString(),
              page,
            );
          cars.push(...pageCars);

          // If this is last page no need to search new pages
          if (isLastPage) {
            this.logger.debug(
              `Page ${page} is last for city ${params.city} platform ${params.platform}`,
            );
            break;
          }
        } catch (err) {
          this.logger.error(
            `Error processing page ${page} city ${params.city} platform ${params.platform}`,
          );
          break;
        }
      }

      // Get newestCar posted at timestamp
      const newestCarPostedAt = this.getNewestCarPostedAt(cars);
      this.logger.debug(
        `Newest car posted at ${newestCarPostedAt?.toISOString()} for city ${
          params.city
        } platform ${params.platform}`,
      );
      this.logger.debug(
        `Cars ${cars.length} found for city ${params.city} platform ${params.platform}`,
        cars,
      );

      return {
        // Fill postedAt for cars with missing field
        cars: cars.map((car) => {
          if (!car.postedAt) {
            car.postedAt = newestCarPostedAt;
          }
          return car;
        }),
      };
    } catch (err) {
      this.logger.error(
        `Unable to get cars for city ${params.city} platform ${params.platform}`,
      );
      throw err;
    } finally {
      await driver.quit();
    }
  }

  private getNewestCarPostedAt(cars: Car[]): Date | null {
    if (cars.length) {
      return cars.sort((a, b) => {
        if (!b.postedAt) {
          return -1;
        }
        if (!a.postedAt) {
          return 1;
        }
        return b.postedAt.getTime() - a.postedAt.getTime();
      })[0].postedAt;
    }

    return null;
  }
}
