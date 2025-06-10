import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentClient } from './interfaces/payment.interface';
import { INotificationClient } from './interfaces/notification.interface';
import { PaymentHttpClient } from './http/payment-http.client';
import { NotificationHttpClient } from './http/notification-http.client';

@Injectable()
export class CommunicationFactory {
  private readonly logger = new Logger(CommunicationFactory.name);

  constructor(private readonly configService: ConfigService) {}

  createPaymentClient(): IPaymentClient {
    const protocol = this.configService.get<string>('PAYMENT_SERVICE_PROTOCOL', 'http');
    
    this.logger.log(`Creating payment client with protocol: ${protocol}`);
    
    switch (protocol.toLowerCase()) {
      case 'http':
        return new PaymentHttpClient(this.configService);
      
      case 'grpc':
        // TODO: Implement when we migrate to gRPC
        // return new PaymentGrpcClient(this.configService);
        this.logger.warn('gRPC not implemented yet, falling back to HTTP');
        return new PaymentHttpClient(this.configService);
      
      default:
        this.logger.warn(`Unsupported payment protocol: ${protocol}, falling back to HTTP`);
        return new PaymentHttpClient(this.configService);
    }
  }

  createNotificationClient(): INotificationClient {
    const protocol = this.configService.get<string>('NOTIFICATION_SERVICE_PROTOCOL', 'http');
    
    this.logger.log(`Creating notification client with protocol: ${protocol}`);
    
    switch (protocol.toLowerCase()) {
      case 'http':
        return new NotificationHttpClient(this.configService);
      
      case 'grpc':
        // TODO: Implement when we migrate to gRPC
        // return new NotificationGrpcClient(this.configService);
        this.logger.warn('gRPC not implemented yet, falling back to HTTP');
        return new NotificationHttpClient(this.configService);
      
      case 'kafka':
        // TODO: Implement Kafka-based notifications for async
        // return new NotificationKafkaClient(this.configService);
        this.logger.warn('Kafka notifications not implemented yet, falling back to HTTP');
        return new NotificationHttpClient(this.configService);
      
      default:
        this.logger.warn(`Unsupported notification protocol: ${protocol}, falling back to HTTP`);
        return new NotificationHttpClient(this.configService);
    }
  }

  // Helper method for future hybrid implementations
  createHybridPaymentClient(): IPaymentClient {
    // This could implement A/B testing, gradual rollout, etc.
    const rolloutPercentage = this.configService.get<number>('GRPC_ROLLOUT_PERCENTAGE', 0);
    
    if (Math.random() * 100 < rolloutPercentage) {
      this.logger.debug('Using gRPC for this payment request (rollout)');
      // return this.createGrpcPaymentClient();
    }
    
    return this.createPaymentClient();
  }
}
