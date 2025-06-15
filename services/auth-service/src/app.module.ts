import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

import { CommunicationModule } from './communication/communication.module';
import { UserService } from './services/user.service';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
      ignoreEnvFile: false,
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseConfig');

        const dbConfig = {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5433),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres123'),
          database: configService.get<string>('DB_NAME', 'auth_db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };

        logger.log(`🔗 Connecting to PostgreSQL`);
        logger.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
        logger.log(`Database: ${dbConfig.database}`);
        logger.log(`User: ${dbConfig.username}`);

        return dbConfig;
      },
    }),

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('JwtConfig');

        const jwtConfig = {
          secret: configService.get<string>('JWT_SECRET', 'fallback-secret'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          },
        };

        logger.log(`🔐 JWT Configuration loaded`);
        logger.log(`⏰ Token expires in: ${jwtConfig.signOptions.expiresIn}`);

        return jwtConfig;
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('ThrottlerConfig');

        const throttlerConfig = [
          {
            name: 'short',
            ttl: configService.get<number>('THROTTLE_TTL', 60000),
            limit: configService.get<number>('THROTTLE_LIMIT', 10),
          },
        ];

        logger.log(`🛡️  Rate limiting configured`);
        logger.log(`⏱️  TTL: ${throttlerConfig[0].ttl}ms, Limit: ${throttlerConfig[0].limit} requests`);

        return throttlerConfig;
      },
    }),

    TypeOrmModule.forFeature([User]),
    CommunicationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    UserService, 
    JwtStrategy],

})
export class AppModule { }