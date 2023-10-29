import { UserRepository } from '../../user/user.repository';
import { Car } from '../../car/car.entity';
import { ElkLogger, LogLevel } from '../../helpers/logger';
import { formatInTimeZone } from 'date-fns-tz';
import * as _ from 'lodash';
import { HttpService } from '@nestjs/axios';
import {
  BackType,
  CheapCar,
  City,
  Color,
  Condition,
  Drive,
  EngineType,
  Seller,
  Transmission,
  Wheel,
} from '../../common';
import { Injectable } from '@nestjs/common';

const botColor: { [key in Color]: string } = {
  [Color.white]: 'белый',
  [Color.gray]: 'серый',
  [Color.silver]: 'серебрянный',
  [Color.black]: 'чёрный',
  [Color.brown]: 'коричневый',
  [Color.gold]: 'золотой',
  [Color.beige]: 'бежевый',
  [Color.red]: 'красный',
  [Color.vinous]: 'бордовый',
  [Color.orange]: 'оранжевый',
  [Color.yellow]: 'желтый',
  [Color.green]: 'зеленый',
  [Color.lightBlue]: 'голубой',
  [Color.blue]: 'синий',
  [Color.violet]: 'фиолеторый',
  [Color.purple]: 'пурпурный',
  [Color.pink]: 'розовый',
};

const botEngineType: { [key in EngineType]: string } = {
  [EngineType.disel]: 'дизель',
  [EngineType.petrol]: 'бензин',
  [EngineType.hybrid]: 'гибрид',
  [EngineType.electric]: 'электро',
};

const botTransmission: { [key in Transmission]: string } = {
  [Transmission.auto]: 'автомат',
  [Transmission.robot]: 'робот',
  [Transmission.vary]: 'вариатор',
  [Transmission.mechanic]: 'механика',
};

const botDrive: { [key in Drive]: string } = {
  [Drive.front]: 'передний',
  [Drive.back]: 'задний',
  [Drive.full]: 'полный',
};

const botWheel: { [key in Wheel]: string } = {
  [Wheel.right]: 'правый',
  [Wheel.left]: 'левый',
};

const botCondition: { [key in Condition]: string } = {
  [Condition.hit]: 'битый',
  [Condition.notHit]: 'не битый',
};

const botBackType: { [key in BackType]: string } = {
  [BackType.sedan]: 'седан',
  [BackType.offroadThreeDoors]: 'внедорожник 3-дверный',
  [BackType.offroadFiveDoors]: 'внедорожник 3-дверный',
  [BackType.universal]: 'универсал',
  [BackType.hatchbackThreeDoors]: 'хетчбек 3-дверный',
  [BackType.hatchbackFiveDoors]: 'хетчбек 5-дверный',
  [BackType.coupe]: 'купе',
  [BackType.minivan]: 'минивэн',
  [BackType.minibus]: 'микроавтобус',
  [BackType.liftback]: 'лифтбек',
  [BackType.pickup]: 'пикап',
  [BackType.van]: 'фургон',
  [BackType.cabrio]: 'кабриолет',
};

const botSeller: { [key in Seller]: string } = {
  [Seller.dealer]: 'автодилер',
  [Seller.private]: 'частное лицо',
};

const botCity: { [key in City]: string } = {
  [City.spb]: 'Санкт-Петербург',
  [City.msk]: 'Москва',
  [City.samara]: 'Самара',
  [City.rostov]: 'Ростов',
  [City.kazan]: 'Казань',
  [City.krasnodar]: 'Краснодар',
  [City.sverdlovsk]: 'Свердловск',
  [City.bashkortostan]: 'Республика Башкортостан',
  [City.chelyabinsk]: 'Челябинск',
  [City.dagestan]: 'Дагестан',
  [City.nizhniy]: 'Нижний Новгород',
};
@Injectable()
export class TgService {
  constructor(
    private readonly httpService: HttpService,
    private readonly elkLogger: ElkLogger,
  ) {}
  async sendCars(chatId: string, cars: Car[]) {
    this.elkLogger.log(UserRepository.name, 'sending cars to tg', {
      chatId,
      cars,
    });
    const sendPromises = [];

    for (const car of cars) {
      const url = `https://api.telegram.org/bot6342868231:AAHx0qLAOdfxi3ZLXy5gzH1LkGyVKRVPIns/sendPhoto?chat_id=${chatId}&photo=${
        car.imageUrl
      }&caption=${this.getTemplate(car)}&parse_mode=html`;
      sendPromises.push(this.httpService.axiosRef.get(url));
    }

    try {
      await Promise.allSettled(sendPromises);
    } catch (error) {
      this.elkLogger.error(
        UserRepository.name,
        'unable to send cars to tg',
        error,
        LogLevel.HIGH,
      );
    }
  }

  private getTemplate(car: Car): string {
    let costDifference: string = '';

    if (car.costDifference === 0) {
      costDifference = 'Нет информации о рыночной стоимости';
    } else if (car.costDifference > 0) {
      costDifference = `🟡 Выше минимальной цены на: ${car.costDifference}₽`;
    } else {
      costDifference = `🟢 Ниже минимальной цены на: ${-car.costDifference}₽`;
    }

    let template = `<b><a href="${car.url}">${car.brand} ${car.model}, ${
      car.year
    }, ${car.engineVolume}, ${botTransmission[car.transmission]}, ${
      car.mileage
    }km</a></b>%0A<b>💰 Цена: ${
      car.price
    } ₽</b>%0A${costDifference}%0A🛠 <b>Параметры:</b>%0A<i>- Мощность двигателя: ${
      car.enginePower
    } л.с.%0A- Обьем двигателя: ${car.engineVolume} л.%0A- Тип двигателя: ${
      botEngineType[car.engineType]
    }%0A- Коробка передач: ${botTransmission[car.transmission]}%0A- Привод: ${
      botDrive[car.drive]
    }%0A- Цвет: ${botColor[car.color]}%0A- Пробег: ${
      car.mileage
    } км.%0A- Руль: ${botWheel[car.wheel]}%0A- Кол-во владельцев: ${
      car.ownersCount
    }%0A- Состояние: ${botCondition[car.condition]}%0A- Тип кузова: ${
      botBackType[car.back]
    }</i>%0A👤 <b>Продавец:</b> ${botSeller[car.seller]}%0A🌏 <b>Город:</b> ${
      botCity[car.city]
    }%0A✅ <b>Ссылка:</b> ${
      car.url
    }%0A⏱ <b>Время получения:</b> ${formatInTimeZone(
      car.postedAt,
      'Europe/Moscow',
      'dd-MM-yyyy HH:mm',
    )} МСК`;

    if (car.phone && car.phone !== 'UNKNOWN') {
      template += `%0A%0AТелефон: ${car.phone}`;
    }

    return template;
  }

  async sendCheapCars(cars: CheapCar[]) {
    const templates = await this.getCheapTemplate(cars);
    for (const template of templates) {
      try {
        const url = `https://api.telegram.org/bot6342868231:AAHx0qLAOdfxi3ZLXy5gzH1LkGyVKRVPIns/sendMessage?chat_id=-1002066074562&text=${template}&parse_mode=html`;
        await this.httpService.axiosRef.get(url);
      } catch (error) {
        this.elkLogger.error(
          UserRepository.name,
          'unable to send cheap cars to tg',
          error,
          LogLevel.HIGH,
        );
      }
    }
    return 0;
  }
  async getCheapTemplate(cars: CheapCar[]): Promise<string[]> {
    let template = '';
    for (const car of cars) {
      const carTemplate = `<b><a href="${car.url}">${car.brand} ${
        car.model
      }</a></b>%0A<b>💰 Цена: ${
        car.price
      } ₽</b>%0A🟢 Ниже минимальной цены на: ${-car.costDifference}₽%0A%0A`;
      template += carTemplate;
    }
    const templates: string[] = [];
    if (template.length >= 4096) {
      const chunksNumber = Math.ceil(template.length / 4096);
      const templateArray = template.split('%0A%0A');
      const chunkSize = Math.ceil(templateArray.length / chunksNumber);
      const templatesChunked = _.chunk(templateArray, chunkSize);
      for (const chunk of templatesChunked) {
        templates.push(chunk.join('%0A%0A'));
      }
    } else {
      templates.push(template);
    }
    return templates;
  }
}
