import {
  IsString,
  Length,
  IsEmail,
  Matches,
  IsIn,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
export class RegisterDto {
  @IsString() @Length(1, 80) name!: string;
  @IsEmail() @Length(3, 254) email!: string;
  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password!: string;
  @IsIn(["MXN"]) currency = "MXN";
}
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @Length(1, 128) password!: string;
}
export class AccountDto {
  @IsString() @Length(1, 80) name!: string;
  @IsIn(["CASH", "BANK", "DEBIT", "OTHER"]) type!: string;
  @Matches(/^-?\d{1,12}(\.\d{1,2})?$/) initialBalance!: string;
  @IsIn(["MXN"]) currency = "MXN";
}
export class CategoryDto {
  @IsString() @Length(1, 60) name!: string;
  @IsIn(["INCOME", "EXPENSE"]) type!: string;
  @IsIn(["NEED", "WANT"]) classification!: string;
}
export class GoalDto {
  @IsString() @Length(1, 80) name!: string;
  @Matches(/^\d{1,12}(\.\d{1,2})?$/) targetAmount!: string;
  @IsOptional() @IsDateString({ strict: true }) targetDate?: string;
}
export class TransactionDto {
  @IsUUID() accountId!: string;
  @IsIn(["INCOME", "EXPENSE", "SAVING"]) type!: string;
  @Matches(/^\d{1,12}(\.\d{1,2})?$/) amount!: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() savingsGoalId?: string;
  @IsString() @Length(0, 240) description = "";
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  transactionDate!: string;
}
export class BudgetDto {
  @IsInt() @Min(0) @Max(100) needs!: number;
  @IsInt() @Min(0) @Max(100) wants!: number;
  @IsInt() @Min(0) @Max(100) savings!: number;
}
export class OnboardDto extends BudgetDto {
  @Matches(/^\d{1,12}(\.\d{1,2})?$/) initialBalance!: string;
  @Matches(/^\d{1,12}(\.\d{1,2})?$/) monthlyIncome!: string;
  @IsIn(["MXN"]) currency = "MXN";
  @IsOptional() @IsString() @Length(1, 80) goalName?: string;
  @IsOptional() @Matches(/^\d{1,12}(\.\d{1,2})?$/) goalTarget?: string;
}
export class SettingsDto {
  @IsString() @Length(1, 80) name!: string;
  @Matches(/^\d{1,12}(\.\d{1,2})?$/) monthlyIncome!: string;
}
export class QueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsIn(["INCOME", "EXPENSE", "SAVING"]) type?: string;
  @IsOptional() @IsUUID() accountId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsDateString({ strict: true }) from?: string;
  @IsOptional() @IsDateString({ strict: true }) to?: string;
  @IsOptional() @IsString() @Length(0, 100) search?: string;
  @IsOptional() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month?: string;
}
