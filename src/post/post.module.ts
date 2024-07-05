import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [PostController],
  providers: [PostService, PrismaService, JwtService, UserService],
})
export class PostModule {}
