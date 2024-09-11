import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PostModule } from 'src/post/post.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserModule } from 'src/user/user.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [UserModule, PostModule],
  controllers: [CommentController],
  providers: [CommentService, PrismaService, JwtService, ConfigService],
})
export class CommentModule {}
