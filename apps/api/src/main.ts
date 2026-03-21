import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston for logging
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security: helmet sets secure HTTP headers
  app.use(helmet());

  // Performance: gzip compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Global validation pipe — validates all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Reject unknown properties
      transform: true, // Auto-transform payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter — centralized error handling
  app.useGlobalFilters(new HttpExceptionFilter() as never);

  // Global interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor() as never,
  );

  // Swagger API docs (only in non-production)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Life Dashboard API')
      .setDescription('The Life Dashboard REST API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
  if (nodeEnv !== 'production') {
    logger.log(`📖 Swagger docs:          http://localhost:${port}/api/docs`);
  }
}
void bootstrap();
