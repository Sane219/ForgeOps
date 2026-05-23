import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.useLogger(app.get(PinoLogger));
  app.setGlobalPrefix('api', { exclude: ['healthz', 'readyz'] });
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? true,
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('ForgeOps API')
    .setDescription('Internal developer platform API')
    .setVersion('0.1.0')
    .addCookieAuth('forgeops_access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('API_PORT', 4000);
  await app.listen(port, '0.0.0.0');
  logger.log(`ForgeOps API listening on http://localhost:${port}`);
  logger.log(`Swagger docs:  http://localhost:${port}/api/docs`);
}

void bootstrap();
