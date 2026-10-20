import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SalaryRecord } from '../../db/entities/salary-record.entity.js';

@Injectable()
export class SalaryRecordRepository {
  constructor(
    @InjectRepository(SalaryRecord)
    private readonly repo: Repository<SalaryRecord>,
  ) {}

  async countByEmployeeId(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repository = manager ? manager.getRepository(SalaryRecord) : this.repo;
    return repository.count({ where: { employeeId } });
  }

  async findByEmployeeAndEffectiveFrom(
    employeeId: string,
    effectiveFrom: string,
    manager?: EntityManager,
  ): Promise<SalaryRecord | null> {
    const repository = manager ? manager.getRepository(SalaryRecord) : this.repo;
    return repository.findOne({
      where: { employeeId, effectiveFrom },
    });
  }

  async findCurrentByEmployeeId(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<SalaryRecord | null> {
    const repository = manager ? manager.getRepository(SalaryRecord) : this.repo;
    return repository
      .createQueryBuilder('salary')
      .leftJoinAndSelect('salary.currency', 'currency')
      .where('salary.employeeId = :employeeId', { employeeId })
      .andWhere('salary.effectiveFrom <= CURRENT_DATE')
      .andWhere('(salary.effectiveTo IS NULL OR salary.effectiveTo >= CURRENT_DATE)')
      .orderBy('salary.effectiveFrom', 'DESC')
      .getOne();
  }

  async findPaginatedByEmployeeId(
    employeeId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: SalaryRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 ? limit : 10;
    const skip = (validPage - 1) * validLimit;

    const [data, total] = await this.repo
      .createQueryBuilder('salary')
      .leftJoinAndSelect('salary.currency', 'currency')
      .where('salary.employeeId = :employeeId', { employeeId })
      .orderBy('salary.effectiveFrom', 'DESC')
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

  async findByIdAndEmployeeId(
    salaryId: string,
    employeeId: string,
  ): Promise<SalaryRecord | null> {
    return this.repo.findOne({
      where: { id: salaryId, employeeId },
      relations: {
        currency: true,
        createdByUser: true,
      },
    });
  }

  async findAllByEmployeeId(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<SalaryRecord[]> {
    const repository = manager ? manager.getRepository(SalaryRecord) : this.repo;
    return repository.find({
      where: { employeeId },
      order: { effectiveFrom: 'ASC' },
    });
  }

  async findLatestByEmployeeId(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<SalaryRecord | null> {
    const repository = manager ? manager.getRepository(SalaryRecord) : this.repo;
    return repository.findOne({
      where: { employeeId },
      order: { effectiveFrom: 'DESC' },
    });
  }

  create(data: Partial<SalaryRecord>, manager?: EntityManager): SalaryRecord {
    const repository = manager ? manager.getRepository(SalaryRecord) : this.repo;
    return repository.create(data);
  }

  async save(
    salaryRecord: SalaryRecord,
    manager?: EntityManager,
  ): Promise<SalaryRecord> {
    const repository = manager ? manager.getRepository(SalaryRecord) : this.repo;
    return repository.save(salaryRecord);
  }
}
