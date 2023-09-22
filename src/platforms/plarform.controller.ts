import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlatformCreateDTO, PlatformUpdateDTO } from './dto/platform.dto';
import { Platform } from 'src/common';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@ApiResponse({
  status: 201,
  description: 'Success',
})
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('platform')
export class PlatformController {
  constructor(private platformService: PlatformService) {}

  @ApiBody({ type: PlatformCreateDTO })
  @Post()
  async create(@Body() platformCreateDTO: PlatformCreateDTO) {
    return this.platformService.create(platformCreateDTO);
  }

  @ApiBody({ type: PlatformUpdateDTO })
  @Put()
  async update(@Body() platformUpdateDTO: PlatformUpdateDTO) {
    return this.platformService.update(platformUpdateDTO);
  }

  @Get()
  async find() {
    return this.platformService.find();
  }

  @ApiParam({ enum: Platform, name: 'platform' })
  @Delete(':platform')
  async delete(@Param('platform') platform: Platform) {
    return this.platformService.delete(platform);
  }
}
