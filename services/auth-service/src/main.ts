import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global pipes - usando nuestro ValidationPipe personalizado
  app.useGlobalPipes(new ValidationPipe());

  // Global filters
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // CORS configuration
  const allowedOrigins = configService.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  logger.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`);

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Health check endpoint (disponible sin prefix)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('🛑 SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('🛑 SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);
  
  logger.log(` Auth Service successfully started on port ${port}`);
  logger.log(` Health Check: http://localhost:${port}/health`);
  logger.log(` API Base URL: http://localhost:${port}/api/v1`);
  logger.log(` Auth endpoints: http://localhost:${port}/api/v1/auth`);
}

bootstrap().catch(error => {
  const logger = new Logger('Bootstrap');
  logger.error('💥 Failed to start application', error.stack);
  process.exit(1);
});