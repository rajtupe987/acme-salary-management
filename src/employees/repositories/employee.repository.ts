import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Employee } from '../../db/entities/employee.entity.js';
import { ListEmployeesQueryDto } from '../dto/list-employees-query.dto.js';

@Injectable()
export class EmployeeRepository {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  async findById(id: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        department: true,
        country: true,
      },
    });
  }

  async findByCode(employeeCode: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { employeeCode },
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { email },
    });
  }

  async findPaginated(
    query: ListEmployeesQueryDto,
  ): Promise<{ data: Employee[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const qb: SelectQueryBuilder<Employee> = this.repo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.country', 'country');

    if (query.departmentId) {
      qb.andWhere('employee.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    if (query.countryId) {
      qb.andWhere('employee.countryId = :countryId', {
        countryId: query.countryId,
      });
    }

    if (query.status) {
      qb.andWhere('employee.employmentStatus = :status', {
        status: query.status,
      });
    }

    if (query.search && query.search.trim()) {
      const searchTerm = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(employee.firstName) LIKE :search OR LOWER(employee.lastName) LIKE :search OR LOWER(CONCAT(employee.firstName, \' \', employee.lastName)) LIKE :search OR LOWER(employee.email) LIKE :search OR LOWER(employee.employeeCode) LIKE :search)',
        { search: searchTerm },
      );
    }

    qb.orderBy('employee.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  create(data: Partial<Employee>): Employee {
    return this.repo.create(data);
  }

  async save(employee: Employee): Promise<Employee> {
    return this.repo.save(employee);
  }
}
