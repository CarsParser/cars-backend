import { Injectable, Logger } from '@nestjs/common';
import { UserDTO, UserUpdateDTO } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.entity';
import { Model } from 'mongoose';

interface IFindParams {
  monitor: boolean;
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
}
