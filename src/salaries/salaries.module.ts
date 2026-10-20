import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryRecord } from '../db/entities/salary-record.entity.js';
import { SalaryAuditLog } from '../db/entities/salary-audit-log.entity.js';
import { Currency } from '../db/entities/currency.entity.js';
import { HrUser } from '../db/entities/hr-user.entity.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { HrUserResolverService } from '../common/services/hr-user-resolver.service.js';
import {
  CurrencyRepository,
  SalaryAuditLogRepository,
  SalaryRecordRepository,
} from './repositories/index.js';
import { SalariesController } from './salaries.controller.js';
import { SalariesService } from './salaries.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryRecord,
      SalaryAuditLog,
      Currency,
      HrUser,
    ]),
    EmployeesModule,
  ],
  controllers: [SalariesController],
  providers: [
    SalariesService,
    SalaryRecordRepository,
    SalaryAuditLogRepository,
    CurrencyRepository,
    HrUserResolverService,
  ],
  exports: [
    SalariesService,
    SalaryRecordRepository,
    SalaryAuditLogRepository,
    CurrencyRepository,
  ],
})
export class SalariesModule {}
