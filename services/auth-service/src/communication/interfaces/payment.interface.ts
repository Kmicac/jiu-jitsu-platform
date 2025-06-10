export interface IPaymentClient {
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResponse>;
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  providerResponse?: any;
  createdAt: Date;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  lastUpdated: Date;
}

export interface RefundResponse {
  refundId: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
}
