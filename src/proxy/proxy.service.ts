import { Injectable } from '@nestjs/common';
import { ProxyDTO } from './dto/proxy.dto';
import { ProxyRepository } from './proxy.repository';

@Injectable()
export class ProxyService {
  constructor(private proxyRepository: ProxyRepository) {}

  async add(proxy: ProxyDTO) {
    return this.proxyRepository.add(proxy);
  }

  async find() {
    return this.proxyRepository.find();
  }

  async delete(proxy: ProxyDTO) {
    return this.proxyRepository.delete(proxy);
  }
}
