import { IsEnum, IsNotEmpty } from 'class-validator';
import { EmploymentStatus } from '../../db/enums/employment-status.enum.js';

export class UpdateStatusDto {
  @IsEnum(EmploymentStatus, {
    message: `status must be one of: ${Object.values(EmploymentStatus).join(', ')}`,
  })
  @IsNotEmpty()
  status!: EmploymentStatus;
}
