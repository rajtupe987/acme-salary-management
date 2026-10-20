
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { SalaryAuditAction } from '../enums/salary-audit-action.enum.js';
import { Employee } from './employee.entity.js';
import { SalaryRecord } from './salary-record.entity.js';
import { HrUser } from './hr-user.entity.js';
import { Currency } from './currency.entity.js';

@Entity('salary_audit_logs')
@Index('idx_audit_employee_created', [
  'employeeId',
  'createdAt',
])
@Index('idx_audit_user_created', [
  'changedBy',
  'createdAt',
])
export class SalaryAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'salary_record_id', type: 'uuid' })
  salaryRecordId!: string;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy!: string;

  @Column({
    type: 'enum',
    enum: SalaryAuditAction,
    enumName: 'salary_audit_action',
  })
  action!: SalaryAuditAction;

  @Column({
    name: 'old_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  oldAmount!: string | null;

  @Column({
    name: 'new_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  newAmount!: string;

  @Column({
    name: 'old_currency_code',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  oldCurrencyCode!: string | null;

  @Column({
    name: 'new_currency_code',
    type: 'varchar',
    length: 3,
  })
  newCurrencyCode!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Employee, (employee) => employee.salaryAuditLogs, {
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: Relation<Employee>;

  @ManyToOne(() => SalaryRecord, (record) => record.auditLogs, {
    nullable: false,
  })
  @JoinColumn({ name: 'salary_record_id' })
  salaryRecord!: Relation<SalaryRecord>;

  @ManyToOne(() => HrUser, (user) => user.salaryAuditLogs, {
    nullable: false,
  })
  @JoinColumn({ name: 'changed_by' })
  changedByUser!: Relation<HrUser>;

  @ManyToOne(() => Currency, (currency) => currency.oldCurrencyAuditLogs, {
    nullable: true,
  })
  @JoinColumn({ name: 'old_currency_code' })
  oldCurrency!: Relation<Currency> | null;

  @ManyToOne(() => Currency, (currency) => currency.newCurrencyAuditLogs, {
    nullable: false,
  })
  @JoinColumn({ name: 'new_currency_code' })
  newCurrency!: Relation<Currency>;
}
