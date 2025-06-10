export interface INotificationClient {
  sendWelcomeEmail(request: WelcomeEmailRequest): Promise<NotificationResponse>;
  sendPasswordResetEmail(request: PasswordResetEmailRequest): Promise<NotificationResponse>;
  sendEmailVerification(request: EmailVerificationRequest): Promise<NotificationResponse>;
  sendSMS(request: SMSRequest): Promise<NotificationResponse>;
}

export interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  verificationToken?: string;
}

export interface PasswordResetEmailRequest {
  userId: string;
  email: string;
  firstName: string;
  resetToken: string;
  resetExpires: Date;
}

export interface EmailVerificationRequest {
  userId: string;
  email: string;
  firstName: string;
  verificationToken: string;
}

export interface SMSRequest {
  userId: string;
  phoneNumber: string;
  message: string;
  type: 'verification' | 'notification' | 'alert';
}

export interface NotificationResponse {
  notificationId: string;
  status: 'sent' | 'pending' | 'failed';
  provider: 'email' | 'sms';
  sentAt?: Date;
  error?: string;
}
