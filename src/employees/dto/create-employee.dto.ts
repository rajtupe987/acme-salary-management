import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  employeeCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId!: string;

  @IsUUID()
  @IsNotEmpty()
  countryId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  designation!: string;

  @IsDateString()
  @IsNotEmpty()
  joiningDate!: string;
}
