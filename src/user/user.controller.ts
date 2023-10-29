import { Body, Controller, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDTO, UserUpdateDTO } from './dto/user.dto';
import { ElkLogger } from 'src/helpers';

@ApiTags('user')
@ApiResponse({
  status: 201,
  description: 'Success',
})
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private elkLogger: ElkLogger,
  ) {}

  @ApiBody({ type: UserDTO })
  @Post()
  async create(@Body() userCreate: UserDTO) {
    this.elkLogger.log(UserController.name, 'creating user', userCreate);
    return this.userService.create(userCreate);
  }

  @ApiBody({ type: UserUpdateDTO })
  @Put()
  async update(@Body() userUpdate: UserUpdateDTO) {
    this.elkLogger.log(UserController.name, 'updating user', userUpdate);
    return this.userService.update(userUpdate);
  }
}
