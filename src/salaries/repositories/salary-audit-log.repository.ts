import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SalaryAuditLog } from '../../db/entities/salary-audit-log.entity.js';

@Injectable()
export class SalaryAuditLogRepository {
  constructor(
    @InjectRepository(SalaryAuditLog)
    private readonly repo: Repository<SalaryAuditLog>,
  ) {}

  async findPaginatedByEmployeeId(
    employeeId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: SalaryAuditLog[]; total: number; page: number; limit: number; totalPages: number }> {
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 ? limit : 10;
    const skip = (validPage - 1) * validLimit;

    const [data, total] = await this.repo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.changedByUser', 'changedByUser')
      .leftJoinAndSelect('log.oldCurrency', 'oldCurrency')
      .leftJoinAndSelect('log.newCurrency', 'newCurrency')
      .leftJoinAndSelect('log.salaryRecord', 'salaryRecord')
      .where('log.employeeId = :employeeId', { employeeId })
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(validLimit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / validLimit) || 1;

    return {
      data,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  create(data: Partial<SalaryAuditLog>, manager?: EntityManager): SalaryAuditLog {
    const repository = manager ? manager.getRepository(SalaryAuditLog) : this.repo;
    return repository.create(data);
  }

  async save(
    log: SalaryAuditLog,
    manager?: EntityManager,
  ): Promise<SalaryAuditLog> {
    const repository = manager ? manager.getRepository(SalaryAuditLog) : this.repo;
    return repository.save(log);
  }
}
