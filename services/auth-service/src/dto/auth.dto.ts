import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserResponseDto } from './user.dto';

// ========== LOGIN DTOs ==========
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponseDto;
}

// ========== TOKEN DTOs ==========
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean = false;
}

// ========== PASSWORD RESET DTOs ==========
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword: string;
}


export class VerifyEmailDto {
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}


export class SuccessResponseDto {
  success: boolean;
  message: string;
}