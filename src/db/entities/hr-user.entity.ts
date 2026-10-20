
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { HrRole } from '../enums/hr-role.enum.js';
import { SalaryRecord } from './salary-record.entity.js';
import { SalaryAuditLog } from './salary-audit-log.entity.js';

@Entity('hr_users')
export class HrUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({
    type: 'enum',
    enum: HrRole,
    enumName: 'hr_role',
    default: HrRole.HR_MANAGER,
  })
  role!: HrRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => SalaryRecord, (record) => record.createdByUser)
  createdSalaryRecords!: Relation<SalaryRecord[]>;

  @OneToMany(() => SalaryAuditLog, (log) => log.changedByUser)
  salaryAuditLogs!: Relation<SalaryAuditLog[]>;
}
