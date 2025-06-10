import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentClient,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  RefundResponse,
} from '../interfaces/payment.interface';

@Injectable()
export class PaymentHttpClient implements IPaymentClient {
  private readonly logger = new Logger(PaymentHttpClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('PAYMENT_SERVICE_URL', 'http://localhost:3004');
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(`Processing payment for user ${request.userId}, amount: ${request.amount}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.userId,
          amount: request.amount,
          currency: request.currency,
          order_id: request.orderId,
          description: request.description,
          metadata: request.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapHttpResponseToPayment(data);
    } catch (error) {
      this.logger.error(`Failed to process payment: ${error.message}`, error.stack);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/${paymentId}/status`);
      
      if (!response.ok) {
        throw new Error(`Payment service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return {
        paymentId: data.payment_id,
        status: data.status,
        amount: data.amount,
        lastUpdated: new Date(data.updated_at),
      };
    } catch (error) {
      this.logger.error(`Failed to get payment status: ${error.message}`, error.stack);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResponse> {
    try {
      this.logger.log(`Refunding payment ${paymentId}, amount: ${amount || 'full'}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          reason: 'User requested refund',
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return {
        refundId: data.refund_id,
        paymentId: data.payment_id,
        amount: data.amount,
        status: data.status,
        reason: data.reason,
      };
    } catch (error) {
      this.logger.error(`Failed to refund payment: ${error.message}`, error.stack);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  private mapHttpResponseToPayment(data: any): PaymentResponse {
    return {
      paymentId: data.payment_id || data.id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      providerResponse: data.provider_data,
      createdAt: new Date(data.created_at),
    };
  }
}
