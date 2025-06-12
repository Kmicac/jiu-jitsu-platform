import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsString, 
  IsArray, 
  IsEnum, 
  IsOptional, 
  MinLength, 
  MaxLength, 
  IsPhoneNumber,
  Matches
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'john.doe@example.com',
    description: 'Email único del usuario'
  })
  @IsEmail({}, { message: 'Email debe tener un formato válido' })
  email: string;

  @ApiProperty({ 
    example: 'johndoe123',
    description: 'Nombre de usuario único' 
  })
  @IsString()
  @MinLength(3, { message: 'Username debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'Username no puede exceder 30 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username solo puede contener letras, números y guiones bajos' 
  })
  username: string;

  @ApiProperty({ 
    example: 'SecurePass123!',
    description: 'Contraseña segura'
  })
  @IsString()
  @MinLength(8, { message: 'Password debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo'
  })
  password: string;

  @ApiProperty({ 
    example: 'John',
    description: 'Nombre del usuario'
  })
  @IsString()
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'Nombre no puede exceder 50 caracteres' })
  firstName: string;

  @ApiProperty({ 
    example: 'Doe',
    description: 'Apellido del usuario'
  })
  @IsString()
  @MinLength(2, { message: 'Apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'Apellido no puede exceder 50 caracteres' })
  lastName: string;

  @ApiPropertyOptional({ 
    example: '+5491234567890',
    description: 'Número de teléfono'
  })
  @IsOptional()
  @IsPhoneNumber(null, { message: 'Número de teléfono debe tener un formato válido' })
  phoneNumber?: string;

  @ApiPropertyOptional({ 
    example: [UserRole.ATHLETE, UserRole.SELLER],
    enum: UserRole,
    isArray: true,
    description: 'Roles del usuario'
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true, message: 'Cada rol debe ser válido' })
  roles?: UserRole[];
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email', 'username'] as const)
) {
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  profileImage?: string;

  @ApiProperty({ enum: UserRole, isArray: true })
  roles: UserRole[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LoginDto {
  @ApiProperty({ 
    example: 'john.doe@example.com',
    description: 'Email o username del usuario'
  })
  @IsString()
  emailOrUsername: string;

  @ApiProperty({ 
    example: 'SecurePass123!',
    description: 'Contraseña del usuario'
  })
  @IsString()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty()
  expiresIn: string;
}
