import { Body, Controller, Logger, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDTO, UserUpdateDTO } from './dto/user.dto';

@ApiTags('user')
@ApiResponse({
  status: 201,
  description: 'Success',
})
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private userService: UserService) {}

  @ApiBody({ type: UserDTO })
  @Post()
  async create(@Body() userCreate: UserDTO) {
    this.logger.debug('Create user', userCreate);
    return this.userService.create(userCreate);
  }

  @ApiBody({ type: UserUpdateDTO })
  @Put()
  async update(@Body() userUpdate: UserUpdateDTO) {
    this.logger.debug('Update user', userUpdate);
    return this.userService.update(userUpdate);
  }
}
