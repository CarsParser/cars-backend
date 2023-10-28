import { Injectable } from '@nestjs/common';
import { UserDTO, UserUpdateDTO } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.entity';
import { Model } from 'mongoose';
import { Car } from '../car/car.entity';
import { HttpService } from '@nestjs/axios';
import {
  BackType,
  City,
  Color,
  Condition,
  Drive,
  EngineType,
  Seller,
  Transmission,
  Wheel,
} from 'src/common';
import { formatInTimeZone } from 'date-fns-tz';
import { ElkLogger } from 'src/helpers';
import { LogLevel } from 'src/helpers/logger';

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

interface IFindParams {
  id: string;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private httpService: HttpService,
    private elkLogger: ElkLogger,
  ) {}

  async findUserIdsToNotify(): Promise<string[]> {
    const users = await this.userModel
      .find({ monitor: true })
      .select({ id: 1 })
      .lean();
    const userIds = users.map((user) => user.id);
    this.elkLogger.log(
      UserRepository.name,
      'user ids to notify',
      userIds,
      LogLevel.LOW,
    );

    return userIds;
  }

  async findOne(params: IFindParams): Promise<User> {
    const user = (await this.userModel.findOne(params).lean()) as User;

    this.elkLogger.log(UserRepository.name, 'find user', user, LogLevel.LOW);

    return user;
  }

  async create(user: UserDTO) {
    const userToCreate = user as User;
    userToCreate.lastWatchedCars = {
      lastWatchedCarDateTime: new Date(),
      lastWatchedCarIds: [],
    };
    const createdUser = await this.userModel.create(user);

    this.elkLogger.log(
      UserRepository.name,
      'user created',
      createdUser,
      LogLevel.LOW,
    );
  }

  async update(user: UserUpdateDTO) {
    let userToUpdate = user as User;
    const userMonitor = await this.userModel
      .findOne({ id: user.id })
      .select({ monitor: 1 })
      .lean();
    if (userMonitor.monitor !== user.monitor) {
      userToUpdate.lastWatchedCars = {
        lastWatchedCarDateTime: new Date(),
        lastWatchedCarIds: [],
      };
    }
    const updateResults = await this.userModel.updateOne({ id: user.id }, user);

    this.elkLogger.log(
      UserRepository.name,
      'updated user',
      updateResults,
      LogLevel.LOW,
    );
  }

  async sendTg(chatId: String, cars: Car[]) {
    this.elkLogger.log(UserRepository.name, 'sending cars to tg', {
      chatId,
      cars,
    });
    const sendPromises = [];

    for (const car of cars) {
      const url = `https://api.telegram.org/bot6342868231:AAHx0qLAOdfxi3ZLXy5gzH1LkGyVKRVPIns/sendPhoto?chat_id=${chatId}&photo=${
        car.imageUrl
      }&caption=${this.getTgTemplate(car)}&parse_mode=html`;
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

  private getTgTemplate(car: Car): string {
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
}
