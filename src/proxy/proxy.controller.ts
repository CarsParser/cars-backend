import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProxyDTO } from './dto/proxy.dto';
import { ProxyService } from './proxy.service';

@ApiTags('proxy')
@ApiResponse({
  status: 201,
  description: 'Success',
})
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('proxy')
export class ProxyController {
  constructor(private proxyService: ProxyService) {}

  @ApiBody({ type: ProxyDTO })
  @Post()
  async add(@Body() proxy: ProxyDTO) {
    return this.proxyService.add(proxy);
  }

  @Get()
  async find() {
    return this.proxyService.find();
  }

  @ApiBody({ type: ProxyDTO })
  @Delete()
  async delete(@Body() proxy: ProxyDTO) {
    return this.proxyService.delete(proxy);
  }
}
