import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EmploymentStatus } from '../../db/enums/employment-status.enum.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListEmployeesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;
}
