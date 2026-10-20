import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrUser } from '../../db/entities/hr-user.entity.js';
import { HrRole } from '../../db/enums/hr-role.enum.js';

@Injectable()
export class HrUserResolverService {
  constructor(
    @InjectRepository(HrUser)
    private readonly hrUserRepository: Repository<HrUser>,
  ) {}

  async resolveHrUserId(providedUserId?: string): Promise<string> {
    if (providedUserId) {
      const user = await this.hrUserRepository.findOne({
        where: { id: providedUserId, isActive: true },
      });
      if (user) {
        return user.id;
      }
    }

    const firstActiveUser = await this.hrUserRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (firstActiveUser) {
      return firstActiveUser.id;
    }

    const defaultHr = this.hrUserRepository.create({
      name: 'HR Administrator',
      email: 'hr.admin@acme.com',
      role: HrRole.HR_MANAGER,
      isActive: true,
    });

    const saved = await this.hrUserRepository.save(defaultHr);
    return saved.id;
  }
}
