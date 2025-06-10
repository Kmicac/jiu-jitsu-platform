import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  INotificationClient,
  WelcomeEmailRequest,
  PasswordResetEmailRequest,
  EmailVerificationRequest,
  SMSRequest,
  NotificationResponse,
} from '../interfaces/notification.interface';

@Injectable()
export class NotificationHttpClient implements INotificationClient {
  private readonly logger = new Logger(NotificationHttpClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://localhost:3005');
  }

  async sendWelcomeEmail(request: WelcomeEmailRequest): Promise<NotificationResponse> {
    try {
      this.logger.log(`Sending welcome email to ${request.email}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/email/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.userId,
          email: request.email,
          first_name: request.firstName,
          last_name: request.lastName,
          verification_token: request.verificationToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Notification service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapHttpResponseToNotification(data);
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`, error.stack);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(request: PasswordResetEmailRequest): Promise<NotificationResponse> {
    try {
      this.logger.log(`Sending password reset email to ${request.email}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/email/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.userId,
          email: request.email,
          first_name: request.firstName,
          reset_token: request.resetToken,
          reset_expires: request.resetExpires.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Notification service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapHttpResponseToNotification(data);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`, error.stack);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendEmailVerification(request: EmailVerificationRequest): Promise<NotificationResponse> {
    try {
      this.logger.log(`Sending email verification to ${request.email}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.userId,
          email: request.email,
          first_name: request.firstName,
          verification_token: request.verificationToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Notification service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapHttpResponseToNotification(data);
    } catch (error) {
      this.logger.error(`Failed to send email verification: ${error.message}`, error.stack);
      throw new Error(`Failed to send email verification: ${error.message}`);
    }
  }

  async sendSMS(request: SMSRequest): Promise<NotificationResponse> {
    try {
      this.logger.log(`Sending SMS to ${request.phoneNumber}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.userId,
          phone_number: request.phoneNumber,
          message: request.message,
          type: request.type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Notification service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapHttpResponseToNotification(data);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  private mapHttpResponseToNotification(data: any): NotificationResponse {
    return {
      notificationId: data.notification_id || data.id,
      status: data.status,
      provider: data.provider,
      sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
      error: data.error,
    };
  }
}
