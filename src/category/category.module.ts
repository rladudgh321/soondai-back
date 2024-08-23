import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserModule } from 'src/user/user.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  imports: [UserModule],
  controllers: [CategoryController],
  providers: [CategoryService, JwtService, PrismaService, ConfigService],
})
export class CategoryModule {}
