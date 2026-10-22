import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmploymentStatus } from '../db/enums/employment-status.enum.js';
import { SalaryAuditAction } from '../db/enums/salary-audit-action.enum.js';
import { SalaryRecord } from '../db/entities/salary-record.entity.js';
import { SalaryAuditLog } from '../db/entities/salary-audit-log.entity.js';
import { EmployeeRepository } from '../employees/repositories/employee.repository.js';
import { HrUserResolverService } from '../common/services/hr-user-resolver.service.js';
import {
  CurrencyRepository,
  SalaryAuditLogRepository,
  SalaryRecordRepository,
} from './repositories/index.js';
import { AssignInitialSalaryDto, ReviseSalaryDto } from './dto/index.js';

function getPreviousDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class SalariesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly employeeRepository: EmployeeRepository,
    private readonly salaryRecordRepository: SalaryRecordRepository,
    private readonly salaryAuditLogRepository: SalaryAuditLogRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly hrUserResolverService: HrUserResolverService,
  ) {}

  private async getEligibleEmployee(employeeId: string) {
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID '${employeeId}' not found.`);
    }
    return employee;
  }

  async assignInitialSalary(
    employeeId: string,
    dto: AssignInitialSalaryDto,
    hrUserId?: string,
  ): Promise<SalaryRecord> {
    const employee = await this.getEligibleEmployee(employeeId);

    if (employee.employmentStatus === EmploymentStatus.TERMINATED) {
      throw new BadRequestException(
        'Cannot assign salary to a terminated employee.',
      );
    }

    const numAmount = Number(dto.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Amount must be a positive number greater than 0.');
    }

    const currency = await this.currencyRepository.findByCode(dto.currencyCode);
    if (!currency) {
      throw new BadRequestException(
        `Currency with code '${dto.currencyCode.toUpperCase()}' does not exist.`,
      );
    }

    const existingCount =
      await this.salaryRecordRepository.countByEmployeeId(employeeId);
    if (existingCount > 0) {
      throw new ConflictException(
        'Employee already has a salary record. Use the revision endpoint to revise salary.',
      );
    }

    const resolvedHrUserId =
      await this.hrUserResolverService.resolveHrUserId(hrUserId);

    return this.dataSource.transaction(async (manager) => {
      const salaryRecord = manager.create(SalaryRecord, {
        employeeId,
        amount: numAmount.toFixed(2),
        currencyCode: dto.currencyCode.toUpperCase(),
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: null,
        changeReason: dto.changeReason ?? 'Initial salary',
        createdBy: resolvedHrUserId,
      });

      const savedRecord = await manager.save(SalaryRecord, salaryRecord);

      const auditLog = manager.create(SalaryAuditLog, {
        employeeId,
        salaryRecordId: savedRecord.id,
        changedBy: resolvedHrUserId,
        action: SalaryAuditAction.INITIAL_SALARY,
        oldAmount: null,
        newAmount: numAmount.toFixed(2),
        oldCurrencyCode: null,
        newCurrencyCode: dto.currencyCode.toUpperCase(),
        reason: dto.changeReason ?? 'Initial salary',
      });

      await manager.save(SalaryAuditLog, auditLog);

      return savedRecord;
    });
  }

  async getCurrentSalary(employeeId: string): Promise<SalaryRecord> {
    await this.getEligibleEmployee(employeeId);

    const currentSalary =
      await this.salaryRecordRepository.findCurrentByEmployeeId(employeeId);
    if (!currentSalary) {
      throw new NotFoundException(
        `No current salary found for employee with ID '${employeeId}'.`,
      );
    }

    return currentSalary;
  }

  async getSalaryHistory(
    employeeId: string,
    page = 1,
    limit = 10,
    offset = 0,
  ) {
    await this.getEligibleEmployee(employeeId);
    return this.salaryRecordRepository.findPaginatedByEmployeeId(
      employeeId,
      page,
      limit,
      offset,
    );
  }

  async reviseSalary(
    employeeId: string,
    dto: ReviseSalaryDto,
    hrUserId?: string,
  ): Promise<SalaryRecord> {
    const employee = await this.getEligibleEmployee(employeeId);

    if (employee.employmentStatus === EmploymentStatus.TERMINATED) {
      throw new BadRequestException(
        'Cannot revise salary of a terminated employee.',
      );
    }

    const numAmount = Number(dto.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Amount must be a positive number greater than 0.');
    }

    const currency = await this.currencyRepository.findByCode(dto.currencyCode);
    if (!currency) {
      throw new BadRequestException(
        `Currency with code '${dto.currencyCode.toUpperCase()}' does not exist.`,
      );
    }

    const existingRecords =
      await this.salaryRecordRepository.findAllByEmployeeId(employeeId);
    if (existingRecords.length === 0) {
      throw new BadRequestException(
        'Employee has no existing salary record. Assign an initial salary first.',
      );
    }

    const conflictingRecord = existingRecords.find((record) => {
      const recordEndDate = record.effectiveTo ?? record.effectiveFrom;
      return (
        record.effectiveFrom <= dto.effectiveFrom &&
        recordEndDate >= dto.effectiveFrom
      );
    });
    if (conflictingRecord) {
      throw new ConflictException(
        `A salary record already exists for the effective period containing '${dto.effectiveFrom}' for this employee.`,
      );
    }

    const precedingRecords = existingRecords
      .filter((r) => r.effectiveFrom < dto.effectiveFrom)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    const precedingRecord = precedingRecords.length > 0 ? precedingRecords[0] : null;

    const succeedingRecords = existingRecords
      .filter((r) => r.effectiveFrom > dto.effectiveFrom)
      .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    const succeedingRecord = succeedingRecords.length > 0 ? succeedingRecords[0] : null;

    const resolvedHrUserId =
      await this.hrUserResolverService.resolveHrUserId(hrUserId);

    return this.dataSource.transaction(async (manager) => {
      if (precedingRecord) {
        precedingRecord.effectiveTo = getPreviousDay(dto.effectiveFrom);
        await manager.save(SalaryRecord, precedingRecord);
      }

      const effectiveTo = succeedingRecord
        ? getPreviousDay(succeedingRecord.effectiveFrom)
        : null;

      const newRecord = manager.create(SalaryRecord, {
        employeeId,
        amount: numAmount.toFixed(2),
        currencyCode: dto.currencyCode.toUpperCase(),
        effectiveFrom: dto.effectiveFrom,
        effectiveTo,
        changeReason: dto.changeReason ?? 'Annual salary revision',
        createdBy: resolvedHrUserId,
      });

      const savedRecord = await manager.save(SalaryRecord, newRecord);

      const oldAmount = precedingRecord ? precedingRecord.amount : null;
      const oldCurrencyCode = precedingRecord
        ? precedingRecord.currencyCode
        : null;

      const auditLog = manager.create(SalaryAuditLog, {
        employeeId,
        salaryRecordId: savedRecord.id,
        changedBy: resolvedHrUserId,
        action: SalaryAuditAction.SALARY_REVISION,
        oldAmount,
        newAmount: numAmount.toFixed(2),
        oldCurrencyCode,
        newCurrencyCode: dto.currencyCode.toUpperCase(),
        reason: dto.changeReason ?? 'Annual salary revision',
      });

      await manager.save(SalaryAuditLog, auditLog);

      return savedRecord;
    });
  }

  async correctSalary(
    employeeId: string,
    dto: ReviseSalaryDto,
    hrUserId?: string,
  ): Promise<SalaryRecord> {
    const employee = await this.getEligibleEmployee(employeeId);

    if (employee.employmentStatus === EmploymentStatus.TERMINATED) {
      throw new BadRequestException(
        'Cannot correct salary of a terminated employee.',
      );
    }

    const numAmount = Number(dto.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException(
        'Amount must be a positive number greater than 0.',
      );
    }

    const currency = await this.currencyRepository.findByCode(dto.currencyCode);
    if (!currency) {
      throw new BadRequestException(
        `Currency with code '${dto.currencyCode.toUpperCase()}' does not exist.`,
      );
    }

    const existingRecords =
      await this.salaryRecordRepository.findAllByEmployeeId(employeeId);
    if (existingRecords.length === 0) {
      throw new BadRequestException(
        'Employee has no existing salary record. Assign an initial salary first.',
      );
    }

    const effectiveDate = dto.effectiveFrom;
    const conflictingRecord = existingRecords.find((record) => {
      const recordEndDate = record.effectiveTo ?? record.effectiveFrom;
      return (
        record.effectiveFrom <= effectiveDate &&
        recordEndDate >= effectiveDate
      );
    });
    if (conflictingRecord) {
      throw new ConflictException(
        `A salary record already exists for the effective period containing '${effectiveDate}' for this employee.`,
      );
    }

    const precedingRecords = existingRecords
      .filter((record) => record.effectiveFrom < effectiveDate)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    const precedingRecord = precedingRecords.length > 0 ? precedingRecords[0] : null;

    const succeedingRecords = existingRecords
      .filter((record) => record.effectiveFrom > effectiveDate)
      .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    const succeedingRecord = succeedingRecords.length > 0 ? succeedingRecords[0] : null;

    const resolvedHrUserId =
      await this.hrUserResolverService.resolveHrUserId(hrUserId);

    return this.dataSource.transaction(async (manager) => {
      if (precedingRecord) {
        precedingRecord.effectiveTo = getPreviousDay(effectiveDate);
        await manager.save(SalaryRecord, precedingRecord);
      }

      const effectiveTo = succeedingRecord
        ? getPreviousDay(succeedingRecord.effectiveFrom)
        : null;

      const correctedRecord = manager.create(SalaryRecord, {
        employeeId,
        amount: numAmount.toFixed(2),
        currencyCode: dto.currencyCode.toUpperCase(),
        effectiveFrom: effectiveDate,
        effectiveTo,
        changeReason: dto.changeReason ?? 'Salary correction',
        createdBy: resolvedHrUserId,
      });

      const savedRecord = await manager.save(SalaryRecord, correctedRecord);

      const auditLog = manager.create(SalaryAuditLog, {
        employeeId,
        salaryRecordId: savedRecord.id,
        changedBy: resolvedHrUserId,
        action: SalaryAuditAction.SALARY_CORRECTION,
        oldAmount: precedingRecord ? precedingRecord.amount : null,
        newAmount: numAmount.toFixed(2),
        oldCurrencyCode: precedingRecord ? precedingRecord.currencyCode : null,
        newCurrencyCode: dto.currencyCode.toUpperCase(),
        reason: dto.changeReason ?? 'Salary correction',
      });

      await manager.save(SalaryAuditLog, auditLog);

      return savedRecord;
    });
  }

  async getSalaryById(
    employeeId: string,
    salaryId: string,
  ): Promise<SalaryRecord> {
    await this.getEligibleEmployee(employeeId);

    const record = await this.salaryRecordRepository.findByIdAndEmployeeId(
      salaryId,
      employeeId,
    );
    if (!record) {
      throw new NotFoundException(
        `Salary record '${salaryId}' not found for employee '${employeeId}'.`,
      );
    }

    return record;
  }

  async getSalaryAuditLogs(
    employeeId: string,
    page = 1,
    limit = 10,
    offset = 0,
  ) {
    await this.getEligibleEmployee(employeeId);
    return this.salaryAuditLogRepository.findPaginatedByEmployeeId(
      employeeId,
      page,
      limit,
      offset,
    );
  }
}
