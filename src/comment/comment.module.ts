import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [CommentController],
  providers: [CommentService, PrismaService, JwtService, ConfigService],
})
export class CommentModule {}
