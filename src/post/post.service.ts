import * as dayjs from 'dayjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/user/enum/role.enum';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}
  async addpost(
    title: string,
    content: string,
    token: string,
    published: boolean,
    highlight: boolean,
    image: string,
    category: string,
    select: Date,
    date_hour?: number,
    date_minute?: number,
  ) {
    console.log('addPost category', category);
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get('jwt').secret,
    });
    const user = await this.prismaService.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new NotFoundException('작성자를 찾을 수 없습니다.');
    }

    // const currentTime = new Date();
    // const alterTime = new Date(select);

    // const hours = currentTime.getHours();
    // const minutes = currentTime.getMinutes();
    // const seconds = currentTime.getSeconds();
    // const milliseconds = currentTime.getMilliseconds();

    // alterTime.setHours(hours);
    // alterTime.setMinutes(minutes);
    // alterTime.setSeconds(seconds);
    // alterTime.setMilliseconds(milliseconds);

    const categoryExists = await this.prismaService.category.findUnique({
      where: { id: category },
    });

    if (!categoryExists) {
      throw new NotFoundException('해당 카테고리가 존재하지 않습니다.');
    }

    // date_hour가 있으면 select에 녹여서 alterTime을 바로 보내고
    // date_hour가 없으면 기존 코드를 사용하여 현재시간을 사용하자

    let alterTime = null;
    const selectDate = new Date(select);
    const date = dayjs(selectDate).format();
    const hello = new Date(date);
    hello.setHours(hello.getHours() + 9);
    hello.setHours(date_hour);
    hello.setMinutes(date_minute);

    date_hour && date_minute
      ? (alterTime = hello)
      : (alterTime = this.createDateMaker(select));

    console.log('alterTime', alterTime);

    // if (date_hour && date_minute) {
    // selectDate.setHours(date_hour);
    // selectDate.setHours(selectDate.getHours() + date_hour);
    // selectDate.setMinutes(date_minute);
    // alterTime = new Date(date);
    // alterTime.setHours(alter);
    // console.log('after select', date, alterTime.toISOString());
    // }

    const post = await this.prismaService.post.create({
      data: {
        title,
        content,
        published,
        highlight,
        image,
        category: {
          connect: {
            id: category,
          },
        },
        select,
        author: { connect: { id: user.id } },
        createdAt: alterTime,
        updatedAt: alterTime,
      },
    });
    return post;
  }

  createDateMaker(select: Date) {
    const currentTime = new Date();
    const alterTime = new Date(select);

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const milliseconds = currentTime.getMilliseconds();

    alterTime.setHours(hours);
    alterTime.setMinutes(minutes);
    alterTime.setSeconds(seconds);
    alterTime.setMilliseconds(milliseconds);

    console.log('currentTime', currentTime);
    alterTime.setHours(alterTime.getHours() + 9);
    console.log('alterTime', alterTime);
    return alterTime;
  }

  async getPosts() {
    const posts = await this.prismaService.post.findMany({
      include: {
        comments: true,
        author: {
          select: {
            name: true,
          },
        },
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return posts;
  }

  async getPost(id: string, token: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id },
    });

    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');

    const decoded = this.jwtService.verify(token);
    if (post.authorId !== decoded?.sub)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    return post;
  }

  async removePost(id: string, data: string) {
    const post = await this.prismaService.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');

    const decoded = this.jwtService.verify(data.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    if (user.role === Role.Admin) {
      return this.removePostByAdmin(id);
    }

    if (post.authorId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    const removePost = await this.prismaService.post.delete({ where: { id } });
    return {
      id: removePost.id,
      title: removePost.title,
      content: removePost.content,
    };
  }

  async removePostByAdmin(id: string) {
    const post = await this.prismaService.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');

    const removePost = await this.prismaService.post.delete({ where: { id } });
    return removePost;
  }

  async updatePost(
    params: string,
    title: string,
    content: string,
    token: string,
    published: boolean,
    highlight: boolean,
    image: string,
    category: string,
    select: Date,
  ) {
    console.log('select****', select);

    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: { id: params },
    });
    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');

    if (user.role === Role.Admin) {
      return this.updatePostByAdmin(params, title, content, token);
    }

    if (post.authorId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    // Check if the category exists
    const existingCategory = await this.prismaService.category.findUnique({
      where: { id: category },
    });

    if (!existingCategory) {
      throw new NotFoundException('카테고리가 존재하지 않습니다');
    }

    const updatePost = await this.prismaService.post.update({
      where: {
        id: params,
      },
      data: {
        title,
        content,
        published,
        highlight,
        image,
        category: {
          connect: {
            id: category,
          },
        },
        select,
        createdAt: this.createDateMaker(select),
      },
    });

    console.log('updatePost****', updatePost);

    return updatePost;
  }

  async updatePostByAdmin(
    id: string,
    title: string,
    content: string,
    token: string,
  ) {
    const decoded = this.jwtService.decode(token);

    const [post, user] = await Promise.all([
      this.prismaService.post.findUnique({
        where: { id },
      }),
      this.prismaService.user.findUnique({
        where: { id: decoded.sub },
      }),
    ]);

    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');
    if (!user) throw new NotFoundException('허용되지 않은 사용자입니다');
    // accessToken의 아이디가 User이면 접근 허용금지

    const role = user.role;
    if (role === Role.User)
      throw new UnauthorizedException('허용되지 않은 접근입니다');

    const updatePost = await this.prismaService.post.update({
      where: {
        id,
      },
      data: {
        title,
        content,
      },
    });

    return updatePost;
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일을 찾을 수 없습니다');
    }
    console.log('file path', file);
    return file.path;
  }

  async pagenationFindAll(page: number, limit: number, category?: string) {
    const skip = (page - 1) * limit;

    if (category) {
      const findCategoryAll = this.prismaService.post.findMany({
        where: {
          categoryId: category,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
      const totalCategory = this.prismaService.post.count({
        where: {
          categoryId: category,
        },
      });

      const [items, total] = await Promise.all([
        findCategoryAll,
        totalCategory,
      ]);

      return {
        items,
        total,
      };
    } else {
      const posts = this.prismaService.post.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const [items, total] = await Promise.all([
        posts,
        this.prismaService.post.count(),
      ]);
      return {
        items,
        total,
      };
    }
  }
}
