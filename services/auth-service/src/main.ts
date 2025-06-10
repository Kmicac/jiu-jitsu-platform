import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // CORS configuration
  const allowedOrigins = configService.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  
  logger.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Jiu Jitsu Platform - Auth Service')
    .setDescription('Authentication and authorization service for the Jiu Jitsu platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  logger.log(`📚 Swagger documentation available at /api/docs`);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
    });
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);
  
  logger.log(` Auth Service successfully started on port ${port}`);
  logger.log(` API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`  Health Check: http://localhost:${port}/health`);
}

bootstrap().catch(error => {
  const logger = new Logger('Bootstrap');
  logger.error('💥 Failed to start application', error.stack);
});