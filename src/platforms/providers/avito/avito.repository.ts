import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SearchCarsData } from 'src/common';
import { FindResponse, ProviderRepository } from '../provider.repository';
import { ProxyRepository } from 'src/proxy/proxy.repository';

@Injectable()
export class AvitoRepository extends ProviderRepository {
  private readonly logger = new Logger(AvitoRepository.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly proxyRepository: ProxyRepository,
  ) {
    super();
  }

  async find(params: SearchCarsData): Promise<FindResponse> {
    const proxy = await this.proxyRepository.get();

    this.logger.debug('Proxy', proxy);

    await this.proxyRepository.add(proxy);
    params;
    return {
      cars: [],
      lastProcessedRecordTimestamp: new Date().toISOString(),
    };
  }
}
