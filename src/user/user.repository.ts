import { Injectable, Logger } from '@nestjs/common';
import { UserDTO, UserUpdateDTO } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.entity';
import { Model } from 'mongoose';
import { Car } from '../car/car.entity';
import { HttpService } from '@nestjs/axios';

interface IFindParams {
  monitor: boolean;
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private httpService: HttpService,
  ) {}

  async find(params: IFindParams): Promise<User[]> {
    const users = (await this.userModel.find(params).lean()) as User[];

    this.logger.debug('Users found', users);

    return users;
  }

  async create(user: UserDTO) {
    const createdUser = await this.userModel.create(user);

    this.logger.debug('User created', createdUser);
  }

  async update(user: UserUpdateDTO) {
    const updateResults = await this.userModel.updateOne({ id: user.id }, user);

    this.logger.debug(`User ${user.id} updated`, updateResults);
  }

  async sendTg(chatId: String, cars: Car[]) {
    this.logger.debug(`Sending cars to chatId: ${chatId}`, cars);
    for (const car of cars) {
      try {
        const url = `https://api.telegram.org/bot6342868231:AAHx0qLAOdfxi3ZLXy5gzH1LkGyVKRVPIns/sendPhoto?chat_id=${chatId}&photo=${
          car.imageUrl
        }&caption=${this.getTgTemplate(car)}&parse_mode=html`;
        await this.httpService.axiosRef.get(url);
      } catch (error) {
        this.logger.error(`Unable to send car chatID:${chatId}`, error);
      }
    }
  }
  private getTgTemplate(car: Car): string {
    const costDifference =
      car.costDifference > 0
        ? `🟡Выше минимальной цены на: ${car.costDifference}`
        : `🟢 Ниже минимальной цены на: ${-car.costDifference}`;
    return `<b><a href="${car.url}">${car.brand} ${car.model}, ${car.year}, ${car.engineVolume}, ${car.transmission}, ${car.mileage}km</a></b>%0A<b>💰 Цена: ${car.price} ₽</b>%0A- Разница в цене: ${costDifference}%0A🛠 <b>Параметры:</b>%0A<i>- Мощность двигателя: ${car.enginePower} л.с.%0A- Обьем двигателя: ${car.engineVolume} л.%0A- Тип двигателя: ${car.engineType}%0A- Коробка передач: ${car.transmission}%0A- Привод: ${car.drive}%0A- Цвет: ${car.color}%0A- Пробег: ${car.mileage} км.%0A- Руль: ${car.wheel}%0A- Кол-во владельцев: ${car.ownersCount}%0A- Состояние: ${car.condition}%0A- Тип кузова: ${car.back}</i>%0A👤 <b>Продавец:</b> ${car.seller}%0A🌏 <b>Город:</b> ${car.city}%0A✅ <b>Ссылка:</b> ${car.url}%0A⏱ <b>Время получения:</b> ${car.postedAt} МСК%0A%0AТелефон: ${car.phone}`;
  }
}
