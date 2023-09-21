import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserDTO, UserUpdateDTO } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(user: UserDTO) {
    return this.userRepository.create(user);
  }

  async update(user: UserUpdateDTO) {
    return this.userRepository.update(user);
  }
}
