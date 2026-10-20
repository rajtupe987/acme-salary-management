import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../../db/entities/country.entity.js';

@Injectable()
export class CountryRepository {
  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
  ) {}

  async findById(id: string): Promise<Country | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveById(id: string): Promise<Country | null> {
    return this.repo.findOne({ where: { id, isActive: true } });
  }
}
