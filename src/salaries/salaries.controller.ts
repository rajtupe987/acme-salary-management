import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { AssignInitialSalaryDto, ReviseSalaryDto } from './dto/index.js';
import { SalariesService } from './salaries.service.js';

@Controller('employees/:employeeId')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  @Post('salaries')
  @HttpCode(HttpStatus.CREATED)
  async assignInitialSalary(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' })) employeeId: string,
    @Body() dto: AssignInitialSalaryDto,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('x-hr-user-id') altHeaderUserId?: string,
  ) {
    const hrUserId = headerUserId ?? altHeaderUserId;
    return this.salariesService.assignInitialSalary(employeeId, dto, hrUserId);
  }

  @Get('salaries/current')
  async getCurrentSalary(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' })) employeeId: string,
  ) {
    return this.salariesService.getCurrentSalary(employeeId);
  }

  @Get('salaries')
  async getSalaryHistory(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' })) employeeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.salariesService.getSalaryHistory(
      employeeId,
      query.page,
      query.limit,
      query.offset,
    );
  }

  @Post('salaries/revisions')
  @HttpCode(HttpStatus.CREATED)
  async reviseSalary(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' })) employeeId: string,
    @Body() dto: ReviseSalaryDto,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('x-hr-user-id') altHeaderUserId?: string,
  ) {
    const hrUserId = headerUserId ?? altHeaderUserId;
    return this.salariesService.reviseSalary(employeeId, dto, hrUserId);
  }

  @Post('salaries/corrections')
  @HttpCode(HttpStatus.CREATED)
  async correctSalary(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' })) employeeId: string,
    @Body() dto: ReviseSalaryDto,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('x-hr-user-id') altHeaderUserId?: string,
  ) {
    const hrUserId = headerUserId ?? altHeaderUserId;
    return this.salariesService.correctSalary(employeeId, dto, hrUserId);
  }

  @Get('salaries/:salaryId')
  async getSalaryById(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' })) employeeId: string,
    @Param('salaryId', new ParseUUIDPipe({ version: '4' })) salaryId: string,
  ) {
    return this.salariesService.getSalaryById(employeeId, salaryId);
  }

  @Get('salary-audit-logs')
  async getSalaryAuditLogs(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' })) employeeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.salariesService.getSalaryAuditLogs(
      employeeId,
      query.page,
      query.limit,
      query.offset,
    );
  }
}
