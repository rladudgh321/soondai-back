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
    origin: true,
    credentials: true,
    exposedHeaders: ['Authorization'],
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

  await app.listen(port);
}
bootstrap();
