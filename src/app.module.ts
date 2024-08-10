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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    UserModule,
    PostModule,
    AuthModule,
    CommentModule,
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
