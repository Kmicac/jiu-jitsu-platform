import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
    });
  }
}