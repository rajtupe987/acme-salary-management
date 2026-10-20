
import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { SalaryRecord } from './salary-record.entity.js';
import { SalaryAuditLog } from './salary-audit-log.entity.js';

@Entity('currencies')
export class Currency {
  @PrimaryColumn({ type: 'varchar', length: 3 })
  code!: string;

  @Column({ type: 'varchar', length: 60 })
  name!: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  symbol!: string | null;

  @Column({ name: 'decimal_places', type: 'smallint', default: 2 })
  decimalPlaces!: number;

  @OneToMany(() => SalaryRecord, (record) => record.currency)
  salaryRecords!: Relation<SalaryRecord[]>;

  @OneToMany(() => SalaryAuditLog, (log) => log.oldCurrency)
  oldCurrencyAuditLogs!: Relation<SalaryAuditLog[]>;

  @OneToMany(() => SalaryAuditLog, (log) => log.newCurrency)
  newCurrencyAuditLogs!: Relation<SalaryAuditLog[]>;
}
