import { Injectable } from '@nestjs/common';
import { UserDTO, UserUpdateDTO } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.entity';
import { Model } from 'mongoose';
import { ElkLogger } from 'src/helpers';
import { LogLevel } from 'src/helpers/logger';

interface IFindParams {
  id: string;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
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
    const userToUpdate = user as User;
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
}
