import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://220.90.185.248:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Origin',
      'X-Requested-With',
      'Accept',
      'authorization',
    ],
    exposedHeaders: ['authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('vlog API board')
    .setDescription('vlog 간단하게 하자')
    .setVersion('0.0.1')
    .addTag('vlog tag')
    .addBearerAuth()

    .build();
  const document = SwaggerModule.createDocument(app, config);
  const swaggerCustomoptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };
  SwaggerModule.setup('api', app, document, swaggerCustomoptions);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const stage = configService.get('STAGE');
  const port = 3065;
  console.info(`서버모드는 ${stage}이고 port는 ${port}`);

  await app.listen(port, '0.0.0.0');
}
bootstrap();
