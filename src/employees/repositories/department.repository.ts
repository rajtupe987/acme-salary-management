import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../db/entities/department.entity.js';

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectRepository(Department)
    private readonly repo: Repository<Department>,
  ) {}

  async findById(id: string): Promise<Department | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveById(id: string): Promise<Department | null> {
    return this.repo.findOne({ where: { id, isActive: true } });
  }
}
