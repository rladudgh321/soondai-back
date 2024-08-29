import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

//Category 1- N Post
@Injectable()
export class CategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async addCategory(token: string, name: string) {
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = this.userService.findOne(decoded.sub);

    const addCategory = this.prismaService.category.create({
      data: {
        name,
      },
    });

    await Promise.all([user, addCategory]);

    return addCategory;
  }

  async getCategories() {
    const category = await this.prismaService.category.findMany();

    return category;
  }

  //nav에서 categoryId를 보내면 카테고리 이름 하나 보내도록하기
  async getCategory(categoryId: string) {
    const category = await this.prismaService.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) throw new NotFoundException('카테고리를 찾지 못하였습니다');

    return category.name;
  }

  async removeCategory(token: string, categoryId: string) {
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = this.userService.findOne(decoded.sub);

    if (!user) {
      throw new NotFoundException('작성자를 찾을 수 습니다.');
    }

    const deleteCategory = await this.prismaService.category.delete({
      where: {
        id: categoryId,
      },
    });

    return deleteCategory;
  }
}
