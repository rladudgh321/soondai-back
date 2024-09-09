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
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.extend(timezone);

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

    const categoryExists = await this.prismaService.category.findUnique({
      where: { id: category },
    });

    if (!categoryExists) {
      throw new NotFoundException('해당 카테고리가 존재하지 않습니다.');
    }

    let alterTime = null;

    const selectDate = dayjs(select).tz('Asia/Seoul');

    if (!!date_hour && !!date_minute) {
      alterTime = selectDate
        .hour(date_hour)
        .minute(date_minute)
        // .second(0) // Optional: set seconds to 0 if needed
        .toDate(); // Convert to local time
      console.log('alterTimealterTime', dayjs(alterTime).format());
    } else {
      alterTime = dayjs(this.createDateMaker(select)).toDate();
    }
    const date = dayjs(alterTime).format();
    console.log('alterTime (Local Time)', dayjs(alterTime).format());
    console.log('alterTime (UTC)', dayjs(alterTime).utc().format());
    console.log('alterTime (ISO)', alterTime.toISOString()); // Log ISO string
    console.log('alterTime', alterTime);
    console.log('date', date);

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
    // alterTime.setHours(alterTime.getHours() + 9);
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
    date_hour?: number,
    date_minute?: number,
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

    let alterTime = null;

    const selectDate = dayjs(select).tz('Asia/Seoul');

    if (!!date_hour && !!date_minute) {
      alterTime = selectDate
        .hour(date_hour)
        .minute(date_minute)
        // .second(0) // Optional: set seconds to 0 if needed
        .toDate(); // Convert to local time
      console.log('alterTimealterTime', dayjs(alterTime).format());
    } else {
      alterTime = dayjs(post.createdAt).toDate();
    }
    const date = dayjs(alterTime).format();
    console.log('alterTime (Local Time)', dayjs(alterTime).format());
    console.log('alterTime (UTC)', dayjs(alterTime).utc().format());
    console.log('alterTime (ISO)', alterTime.toISOString()); // Log ISO string
    console.log('alterTime', alterTime);
    console.log('date', date);

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
        createdAt: alterTime,
        updatedAt: dayjs(Date.now()).toDate(),
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
