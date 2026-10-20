import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class AssignInitialSalaryDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a valid positive decimal number string',
  })
  amount!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3, { message: 'currencyCode must be a 3-letter currency code (e.g. INR, USD)' })
  currencyCode!: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveFrom!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeReason?: string;
}
