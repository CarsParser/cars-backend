import * as _ from 'lodash';
import stringify = require('fast-json-stable-stringify');
import { formatInTimeZone } from 'date-fns-tz';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum LogLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

@Injectable()
export class ElkLogger {
  constructor(private configService: ConfigService) {}

  log(
    service_name: string,
    message: string,
    payload: any = {},
    log_level: LogLevel = LogLevel.MEDIUM,
  ) {
    const logObject = {
      service_name,
      logger_type: 'SERVICE_LOGGER',
      message,
      log_level,
      log_time: formatInTimeZone(
        new Date(),
        'Europe/Moscow',
        'yyyy-MM-dd HH:mm:ssXXX',
      ),
    };

    if (this.configService.get('ENV') === 'production') {
      console.log(
        stringify(
          {
            payload,
            ...logObject,
          },
          //@ts-ignore
          { cycles: true },
        ),
      );
    } else {
      console.log(
        `[\x1b[32m${logObject.log_level} ${new Date(
          logObject.log_time,
        ).toLocaleTimeString()}\x1b[0m] ${logObject.service_name}: ${
          logObject.message
        } `,
        stringify(
          {
            payload,
          },
          //@ts-ignore
          { cycles: true },
        ),
      );
    }
  }

  error(
    service_name: string,
    message: string,
    err: any = {},
    log_level: LogLevel = LogLevel.MEDIUM,
  ) {
    console.error(
      stringify(
        {
          error_name: err?.name,
          error_message: err?.message,
          error_trace: err?.stack,
          error_stderr: err?.stderr,
          logger_type: 'SERVICE_LOGGER',
          service_name,
          message,
          log_level,
          log_time: formatInTimeZone(
            new Date(),
            'Europe/Moscow',
            'yyyy-MM-dd HH:mm:ssXXX',
          ),
          err_data: err,
        },
        //@ts-ignore
        { cycles: true },
      ),
    );
  }
}
