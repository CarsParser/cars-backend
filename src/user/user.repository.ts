import { Injectable } from "@nestjs/common";
import { UserDTO, UserUpdateDTO } from "./dto/user.dto";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./user.entity";
import { Model } from "mongoose";

interface IFindParams {
  monitor: boolean;
}

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async find(params: IFindParams): Promise<UserDTO[]> {
    // @ts-ignore
    return this.userModel.find(params).lean() as UserDTO[];
  }

  async create(user: UserDTO) {
    await this.userModel.create(user);
  }

  async update(user: UserUpdateDTO) {
    await this.userModel.updateOne({ id: user.id }, user);
  }
}
