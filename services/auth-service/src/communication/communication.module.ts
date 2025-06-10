import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommunicationFactory } from './factory';
import { PaymentHttpClient } from './http/payment-http.client';
import { NotificationHttpClient } from './http/notification-http.client';
import { IPaymentClient } from './interfaces/payment.interface';
import { INotificationClient } from './interfaces/notification.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    CommunicationFactory,
    PaymentHttpClient,
    NotificationHttpClient,
    {
      provide: 'IPaymentClient',
      useFactory: (factory: CommunicationFactory): IPaymentClient => {
        return factory.createPaymentClient();
      },
      inject: [CommunicationFactory],
    },
    {
      provide: 'INotificationClient',
      useFactory: (factory: CommunicationFactory): INotificationClient => {
        return factory.createNotificationClient();
      },
      inject: [CommunicationFactory],
    },
  ],
  exports: [
    'IPaymentClient',
    'INotificationClient',
    CommunicationFactory,
  ],
})
export class CommunicationModule {}
