import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

// ========== REGISTER DTO ==========
export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

// ========== UPDATE PROFILE DTO ==========
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(25)
  @Matches(/^[+\d\s\-\(\)]+$/, {
    message: 'Phone number can only contain numbers, spaces, hyphens, parentheses and plus sign'
  })
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  profilePicture?: string;
}

// ========== UPDATE USER ROLES DTO ==========
export class UpdateUserRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}

// ========== USER RESPONSE DTO ==========
export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  roles: UserRole[];
  status: UserStatus;
  emailVerified: boolean;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}