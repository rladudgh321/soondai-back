import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { Role } from './enum/role.enum';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number, size: number) {
    const user = await this.prisma.user.findMany({
      skip: (page - 1) * size,
      take: size,
    });
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();

    return user;
  }

  async checkAdminUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user.role === Role.Admin;
  }
}
