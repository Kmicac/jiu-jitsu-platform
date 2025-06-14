import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import {
  RegisterDto,
  UpdateProfileDto,
  UpdateUserRolesDto,
  UserResponseDto,
} from '../dto/user.dto';
import { INotificationClient } from '../communication/interfaces/notification.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    @Inject('INotificationClient')
    private readonly notificationClient: INotificationClient,
  ) {}

  async create(registerDto: RegisterDto): Promise<UserResponseDto> {
    const { email, roles = [UserRole.USER], ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create verification token
    const emailVerificationToken = this.generateSecureToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = this.userRepository.create({
      ...userData,
      email: email.toLowerCase(),
      roles,
      emailVerificationToken,
      emailVerificationExpires,
      status: UserStatus.PENDING,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User created: ${savedUser.email} (${savedUser.id})`);

      // Send welcome email asynchronously
      this.sendWelcomeEmailAsync(savedUser, emailVerificationToken);

      return this.toUserResponse(savedUser);
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create user');
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: [
        'id', 'firstName', 'lastName', 'email', 'password', 'roles', 'status',
        'emailVerified', 'loginAttempts', 'lockedUntil', 'lastLoginAt'
      ],
    });
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateDto);

    try {
      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`User profile updated: ${updatedUser.email}`);
      return this.toUserResponse(updatedUser);
    } catch (error) {
      this.logger.error(`Failed to update user profile: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update profile');
    }
  }

  async updateRoles(userId: string, updateRolesDto: UpdateUserRolesDto): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.roles = updateRolesDto.roles;

    try {
      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`User roles updated: ${updatedUser.email} -> ${updatedUser.roles.join(', ')}`);
      return this.toUserResponse(updatedUser);
    } catch (error) {
      this.logger.error(`Failed to update user roles: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update roles');
    }
  }

  async verifyEmail(token: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    user.emailVerified = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    try {
      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`Email verified: ${updatedUser.email}`);
      return this.toUserResponse(updatedUser);
    } catch (error) {
      this.logger.error(`Failed to verify email: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to verify email');
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new token
    const emailVerificationToken = this.generateSecureToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;

    try {
      await this.userRepository.save(user);
      
      // Send verification email
      await this.notificationClient.sendEmailVerification({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        verificationToken: emailVerificationToken,
      });

      this.logger.log(`Verification email resent: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to resend verification email: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to resend verification email');
    }
  }

  async createPasswordResetToken(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const resetToken = this.generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;

    try {
      await this.userRepository.save(user);

      // Send password reset email
      await this.notificationClient.sendPasswordResetEmail({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        resetToken,
        resetExpires,
      });

      this.logger.log(`Password reset token created: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to create password reset token: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create password reset token');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
      select: ['id', 'email', 'passwordResetToken', 'passwordResetExpires', 'password'],
    });

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    user.password = newPassword; // Will be hashed by BeforeUpdate hook
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.loginAttempts = 0;
    user.lockedUntil = null;

    try {
      await this.userRepository.save(user);
      this.logger.log(`Password reset completed: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to reset password: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to reset password');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = newPassword; // Will be hashed by BeforeUpdate hook

    try {
      await this.userRepository.save(user);
      this.logger.log(`Password changed: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to change password: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to change password');
    }
  }

  async recordLoginAttempt(userId: string, success: boolean): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    if (success) {
      user.resetLoginAttempts();
    } else {
      user.incrementLoginAttempts();
    }

    await this.userRepository.save(user);
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.DEACTIVATED;
    await this.userRepository.save(user);
    
    this.logger.log(`User deactivated: ${user.email}`);
  }

  async reactivateUser(userId: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.ACTIVE;
    user.unlock();
    
    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`User reactivated: ${user.email}`);
    
    return this.toUserResponse(updatedUser);
  }

  private async sendWelcomeEmailAsync(user: User, verificationToken: string): Promise<void> {
    try {
      await this.notificationClient.sendWelcomeEmail({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationToken,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`, error.stack);
    }
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
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