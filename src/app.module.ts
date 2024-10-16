import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import jwtConfig from './config/jwt.config';
import { PostModule } from './post/post.module';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { CommentModule } from './comment/comment.module';
import { CategoryModule } from './category/category.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // 업로드된 파일이 저장될 경로
      serveRoot: '/uploads/', // 접근할 URL 경로
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    UserModule,
    PostModule,
    AuthModule,
    CommentModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    Logger,
    JwtService,
    UserService,
  ],
})
export class AppModule {}
