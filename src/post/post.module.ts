import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { MulterConfigService } from './multer.config';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
  ],
  controllers: [PostController],
  providers: [
    PostService,
    PrismaService,
    JwtService,
    UserService,
    ConfigService,
  ],
  exports: [PostService],
})
export class PostModule {}
