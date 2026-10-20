import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Currency } from '../../db/entities/currency.entity.js';

@Injectable()
export class CurrencyRepository {
  constructor(
    @InjectRepository(Currency)
    private readonly repo: Repository<Currency>,
  ) {}

  async findByCode(code: string, manager?: EntityManager): Promise<Currency | null> {
    const repository = manager ? manager.getRepository(Currency) : this.repo;
    return repository.findOne({ where: { code: code.toUpperCase() } });
  }
}
