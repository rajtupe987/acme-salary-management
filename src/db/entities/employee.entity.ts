
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { EmploymentStatus } from '../enums/employment-status.enum.js';
import { Country } from './country.entity.js';
import { Department } from './department.entity.js';
import { SalaryRecord } from './salary-record.entity.js';
import { SalaryAuditLog } from './salary-audit-log.entity.js';

@Entity('employees')
@Index('idx_employees_department_status', [
  'departmentId',
  'employmentStatus',
])
@Index('idx_employees_country_status', [
  'countryId',
  'employmentStatus',
])
@Index('idx_employees_name', ['lastName', 'firstName'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'employee_code',
    type: 'varchar',
    length: 30,
    unique: true,
  })
  employeeCode!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId!: string;

  @Column({ type: 'varchar', length: 120 })
  designation!: string;

  @Column({ name: 'joining_date', type: 'date' })
  joiningDate!: string;

  @Column({
    name: 'employment_status',
    type: 'enum',
    enum: EmploymentStatus,
    enumName: 'employment_status',
    default: EmploymentStatus.ACTIVE,
  })
  employmentStatus!: EmploymentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: false,
  })
  @JoinColumn({ name: 'department_id' })
  department!: Relation<Department>;

  @ManyToOne(() => Country, (country) => country.employees, {
    nullable: false,
  })
  @JoinColumn({ name: 'country_id' })
  country!: Relation<Country>;

  @OneToMany(() => SalaryRecord, (record) => record.employee)
  salaryRecords!: Relation<SalaryRecord[]>;

  @OneToMany(() => SalaryAuditLog, (log) => log.employee)
  salaryAuditLogs!: Relation<SalaryAuditLog[]>;
}
