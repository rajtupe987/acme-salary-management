import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmploymentStatus } from '../db/enums/employment-status.enum.js';
import { Employee } from '../db/entities/employee.entity.js';
import {
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
  UpdateStatusDto,
} from './dto/index.js';
import {
  CountryRepository,
  DepartmentRepository,
  EmployeeRepository,
} from './repositories/index.js';

@Injectable()
export class EmployeesService {
  private static readonly ALLOWED_TRANSITIONS: Record<
    EmploymentStatus,
    EmploymentStatus[]
  > = {
    [EmploymentStatus.ACTIVE]: [
      EmploymentStatus.ON_LEAVE,
      EmploymentStatus.INACTIVE,
      EmploymentStatus.TERMINATED,
    ],
    [EmploymentStatus.ON_LEAVE]: [
      EmploymentStatus.ACTIVE,
      EmploymentStatus.INACTIVE,
      EmploymentStatus.TERMINATED,
    ],
    [EmploymentStatus.INACTIVE]: [
      EmploymentStatus.ACTIVE,
      EmploymentStatus.TERMINATED,
    ],
    [EmploymentStatus.TERMINATED]: [],
  };

  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly countryRepository: CountryRepository,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const activeDepartment = await this.departmentRepository.findActiveById(
      dto.departmentId,
    );
    if (!activeDepartment) {
      throw new BadRequestException('Department does not exist or is inactive.');
    }

    const activeCountry = await this.countryRepository.findActiveById(
      dto.countryId,
    );
    if (!activeCountry) {
      throw new BadRequestException('Country does not exist or is inactive.');
    }

    const existingCode = await this.employeeRepository.findByCode(
      dto.employeeCode,
    );
    if (existingCode) {
      throw new ConflictException(
        `Employee with code '${dto.employeeCode}' already exists.`,
      );
    }

    const existingEmail = await this.employeeRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException(
        `Employee with email '${dto.email}' already exists.`,
      );
    }

    const employee = this.employeeRepository.create({
      employeeCode: dto.employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      departmentId: dto.departmentId,
      countryId: dto.countryId,
      designation: dto.designation,
      joiningDate: dto.joiningDate,
      employmentStatus: EmploymentStatus.ACTIVE,
    });

    const saved = await this.employeeRepository.save(employee);
    const result = await this.employeeRepository.findById(saved.id);
    return result ?? saved;
  }

  async findAll(query: ListEmployeesQueryDto) {
    return this.employeeRepository.findPaginated(query);
  }

  async findById(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee with ID '${id}' not found.`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findById(id);

    if (dto.departmentId) {
      const activeDepartment = await this.departmentRepository.findActiveById(
        dto.departmentId,
      );
      if (!activeDepartment) {
        throw new BadRequestException(
          'Department does not exist or is inactive.',
        );
      }
      employee.departmentId = dto.departmentId;
    }

    if (dto.countryId) {
      const activeCountry = await this.countryRepository.findActiveById(
        dto.countryId,
      );
      if (!activeCountry) {
        throw new BadRequestException(
          'Country does not exist or is inactive.',
        );
      }
      employee.countryId = dto.countryId;
    }

    if (dto.employeeCode && dto.employeeCode !== employee.employeeCode) {
      const existing = await this.employeeRepository.findByCode(
        dto.employeeCode,
      );
      if (existing) {
        throw new ConflictException(
          `Employee with code '${dto.employeeCode}' already exists.`,
        );
      }
      employee.employeeCode = dto.employeeCode;
    }

    if (dto.email && dto.email !== employee.email) {
      const existing = await this.employeeRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException(
          `Employee with email '${dto.email}' already exists.`,
        );
      }
      employee.email = dto.email;
    }

    if (dto.firstName !== undefined) employee.firstName = dto.firstName;
    if (dto.lastName !== undefined) employee.lastName = dto.lastName;
    if (dto.designation !== undefined) employee.designation = dto.designation;
    if (dto.joiningDate !== undefined) employee.joiningDate = dto.joiningDate;

    await this.employeeRepository.save(employee);
    const updated = await this.employeeRepository.findById(id);
    return updated ?? employee;
  }

  async updateStatus(id: string, dto: UpdateStatusDto): Promise<Employee> {
    const employee = await this.findById(id);
    const currentStatus = employee.employmentStatus;
    const newStatus = dto.status;

    if (currentStatus === newStatus) {
      return employee;
    }

    if (currentStatus === EmploymentStatus.TERMINATED) {
      throw new BadRequestException(
        'Cannot change status of a TERMINATED employee. Restoring a terminated employee requires a separate approval process.',
      );
    }

    const allowed = EmployeesService.ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ')}`,
      );
    }

    employee.employmentStatus = newStatus;
    await this.employeeRepository.save(employee);
    const updated = await this.employeeRepository.findById(id);
    return updated ?? employee;
  }
}
