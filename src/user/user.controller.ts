import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserDTO, UserUpdateDTO } from "./dto/user.dto";

@ApiTags('users')
@ApiResponse({ status: 201, description: 'The user has been successfully created.'})
@ApiResponse({ status: 500, description: 'Internal server error.'})
@Controller('user')
export class UserController {
    constructor(private userService: UserService) {}

    @ApiBody({ type: UserDTO })
    @Post('create')
    async create(@Body() userCreate: UserDTO) {
        return this.userService.create(userCreate);
    }

    @ApiBody({ type: UserUpdateDTO })
    @Post('update')
    async update(@Body() userUpdate: UserUpdateDTO) {
        return this.userService.update(userUpdate);
    }
}
