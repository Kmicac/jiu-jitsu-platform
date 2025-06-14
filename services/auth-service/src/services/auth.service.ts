import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { User, UserStatus } from '../entities/user.entity';
import {
  LoginDto,
  LoginResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from '../dto/auth.dto';
import { 
  RegisterDto, 
  UserResponseDto } from '@/dto/user.dto';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    this.logger.log(`Registration attempt: ${registerDto.email}`);
    
    try {
      const user = await this.userService.create(registerDto);
      this.logger.log(`User registered successfully: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password, rememberMe = false } = loginDto;
    
    this.logger.log(`Login attempt: ${email}`);

    // Find user with password
    const user = await this.userService.findByEmailWithPassword(email);
    
    if (!user) {
      this.logger.warn(`Login failed - user not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      this.logger.warn(`Login failed - account locked: ${email}`);
      throw new UnauthorizedException('Account is temporarily locked due to too many failed attempts');
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn(`Login failed - account not active: ${email} (status: ${user.status})`);
      throw new UnauthorizedException('Account is not active');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      await this.userService.recordLoginAttempt(user.id, false);
      this.logger.warn(`Login failed - invalid password: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      this.logger.warn(`Login failed - email not verified: ${email}`);
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Record successful login
    await this.userService.recordLoginAttempt(user.id, true);

    // Generate tokens
    const tokens = await this.generateTokenPair(user, rememberMe);
    
    this.logger.log(`Login successful: ${email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'bearer',
      expiresIn: this.getTokenExpirationTime(false),
      user: this.toUserResponse(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
      });

      const user = await this.userService.findById(payload.sub);
      
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokenPair(user);
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    
    this.logger.log(`Password reset requested: ${email}`);
    
    try {
      await this.userService.createPasswordResetToken(email);
      this.logger.log(`Password reset token created: ${email}`);
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;
    
    this.logger.log(`Password reset attempt with token: ${token.substring(0, 8)}...`);
    
    try {
      await this.userService.resetPassword(token, newPassword);
      this.logger.log(`Password reset successful`);
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;
    
    this.logger.log(`Password change attempt: ${userId}`);
    
    try {
      await this.userService.changePassword(userId, currentPassword, newPassword);
      this.logger.log(`Password changed successfully: ${userId}`);
    } catch (error) {
      this.logger.error(`Password change failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<UserResponseDto> {
    const { token } = verifyEmailDto;
    
    this.logger.log(`Email verification attempt with token: ${token.substring(0, 8)}...`);
    
    try {
      const user = await this.userService.verifyEmail(token);
      this.logger.log(`Email verified successfully: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async resendVerificationEmail(resendDto: ResendVerificationDto): Promise<void> {
    const { email } = resendDto;
    
    this.logger.log(`Verification email resend requested: ${email}`);
    
    try {
      await this.userService.resendVerificationEmail(email);
      this.logger.log(`Verification email resent: ${email}`);
    } catch (error) {
      this.logger.error(`Resend verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    return user;
  }

  async logout(userId: string, allDevices: boolean = false): Promise<void> {
    this.logger.log(`Logout: ${userId} (all devices: ${allDevices})`);
    
    // In a more advanced implementation, you would:
    // 1. Blacklist the current token(s)
    // 2. If allDevices=true, invalidate all refresh tokens for the user
    // 3. Store blacklisted tokens in Redis with expiration
    
    // For now, we just log the logout
    // TODO: Implement token blacklisting with Redis
  }

  private async generateTokenPair(user: User, rememberMe: boolean = false): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessTokenExpiry = this.configService.get('JWT_EXPIRES_IN', '15m');
    const refreshTokenExpiry = rememberMe 
      ? this.configService.get('JWT_REFRESH_LONG_EXPIRES_IN', '30d')
      : this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: accessTokenExpiry,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: refreshTokenExpiry,
        secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private getTokenExpirationTime(isRefresh: boolean = false): number {
    const expiry = isRefresh 
      ? this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d')
      : this.configService.get('JWT_EXPIRES_IN', '15m');
    
    // Convert to seconds
    const timeUnit = expiry.slice(-1);
    const timeValue = parseInt(expiry.slice(0, -1));
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 24 * 60 * 60;
      default: return 900; // 15 minutes default
    }
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0],
      gender: user.gender,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}