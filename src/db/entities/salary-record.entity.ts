
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { Employee } from './employee.entity.js';
import { Currency } from './currency.entity.js';
import { HrUser } from './hr-user.entity.js';
import { SalaryAuditLog } from './salary-audit-log.entity.js';

@Entity('salary_records')
@Index('idx_salary_employee_effective', [
  'employeeId',
  'effectiveFrom',
])
@Index('idx_salary_currency_effective', [
  'currencyCode',
  'effectiveFrom',
])
@Index(
  'uq_salary_employee_start',
  ['employeeId', 'effectiveFrom'],
  { unique: true },
)
@Check('chk_salary_amount_positive', '"amount" > 0')
@Check(
  'chk_salary_effective_dates',
  '"effective_to" IS NULL OR "effective_to" >= "effective_from"',
)
export class SalaryRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string;

  @Column({
    name: 'currency_code',
    type: 'varchar',
    length: 3,
  })
  currencyCode!: string;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({
    name: 'effective_to',
    type: 'date',
    nullable: true,
  })
  effectiveTo!: string | null;

  @Column({
    name: 'change_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  changeReason!: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Employee, (employee) => employee.salaryRecords, {
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: Relation<Employee>;

  @ManyToOne(() => Currency, (currency) => currency.salaryRecords, {
    nullable: false,
  })
  @JoinColumn({ name: 'currency_code' })
  currency!: Relation<Currency>;

  @ManyToOne(() => HrUser, (user) => user.createdSalaryRecords, {
    nullable: false,
  })
  @JoinColumn({ name: 'created_by' })
  createdByUser!: Relation<HrUser>;

  @OneToMany(() => SalaryAuditLog, (log) => log.salaryRecord)
  auditLogs!: Relation<SalaryAuditLog[]>;
}
