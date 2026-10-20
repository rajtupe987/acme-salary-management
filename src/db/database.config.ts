
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';

import {
  Country,
  Department,
  Currency,
  HrUser,
  Employee,
  SalaryRecord,
  SalaryAuditLog,
} from './entities/index.js';

export const databaseEntities = [
  Country,
  Department,
  Currency,
  HrUser,
  Employee,
  SalaryRecord,
  SalaryAuditLog,
];

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.getOrThrow<string>('DATABASE_URL'),

  entities: databaseEntities,

  synchronize: false,
  logging: true,
});
