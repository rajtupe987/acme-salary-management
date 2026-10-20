import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../db/entities/employee.entity.js';
import { Department } from '../db/entities/department.entity.js';
import { Country } from '../db/entities/country.entity.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import {
  CountryRepository,
  DepartmentRepository,
  EmployeeRepository,
} from './repositories/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Department, Country])],
  controllers: [EmployeesController],
  providers: [
    EmployeesService,
    EmployeeRepository,
    DepartmentRepository,
    CountryRepository,
  ],
  exports: [
    EmployeesService,
    EmployeeRepository,
    DepartmentRepository,
    CountryRepository,
  ],
})
export class EmployeesModule {}
