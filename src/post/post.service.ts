import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/user/enum/role.enum';
import { UserService } from 'src/user/user.service';
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
    highlight: boolean,
    image: string,
    category: string,
    select: Date,
    date_hour?: number,
    date_minute?: number,
  ) {
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

    //시간 설정 createdAt
    let alterTime = null;

    const selectDate = dayjs(select).tz('Asia/Seoul');

    if (!!date_hour && !!date_minute) {
      // 선택 시간과 선택 분이 설정되지 않았다면
      alterTime = selectDate
        .hour(date_hour)
        .minute(date_minute)
        // .second(0) // Optional: set seconds to 0 if needed
        .toDate(); // Convert to local time
    } else {
      // selecte에는 날짜 선택된 시간,분이 있음
      alterTime = dayjs(this.createDateMaker(select)).toDate();
    }
    const date = dayjs(alterTime).format();
    const post = await this.prismaService.post.create({
      data: {
        title,
        content,
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

  // 선택된 날짜에 오늘 날짜의 시간 붙이기
  createDateMaker(select: Date) {
    const currentTime = new Date(); //오늘 날짜
    const alterTime = new Date(select); //선택된 날짜

    // 오늘 날짜의 시분초
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const milliseconds = currentTime.getMilliseconds();

    // 선택된 날짜에 오늘날짜의 시분초 붙이기
    alterTime.setHours(hours);
    alterTime.setMinutes(minutes);
    alterTime.setSeconds(seconds);
    alterTime.setMilliseconds(milliseconds);

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

  async navCount() {
    const categoryCounts = this.prismaService.post.groupBy({
      by: ['categoryId'],
      _count: {
        id: true,
      },
    });

    const postCount = this.prismaService.post.count();
    const [categoryCount, total] = await Promise.all([
      categoryCounts,
      postCount,
    ]);

    return {
      categoryCount,
      total,
    };
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
    const removePost = await this.prismaService.post.delete({ where: { id } });

    return {
      id: removePost.id,
    };
  }

  async updatePost(
    params: string,
    title: string,
    content: string,
    token: string,
    highlight: boolean,
    image: string,
    category: string,
    select: Date,
    date_hour?: number,
    date_minute?: number,
  ) {
    const decoded = this.jwtService.verify(token.split(' ')[1], {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: { id: params },
    });
    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');

    // Check if the category exists
    const existingCategory = await this.prismaService.category.findUnique({
      where: { id: category },
    });

    if (!existingCategory) {
      throw new NotFoundException('카테고리가 존재하지 않습니다');
    }

    if (user.role === Role.Admin) {
      return this.updatePostByAdmin(
        params,
        title,
        content,
        highlight,
        image,
        category,
        select,
        date_hour,
        date_minute,
      );
    }

    if (post.authorId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    let alterTime = null;

    const selectDate = dayjs(select).tz('Asia/Seoul');

    if (!!date_hour && !!date_minute) {
      alterTime = selectDate.hour(date_hour).minute(date_minute).toDate(); // Convert to local time
    } else {
      alterTime = dayjs(this.createDateMaker(select)).toDate();
    }
    const date = dayjs(alterTime).format();
    const updatePost = await this.prismaService.post.update({
      where: {
        id: params,
      },
      data: {
        title,
        content,
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

    return updatePost;
  }

  private async updatePostByAdmin(
    id: string,
    title: string,
    content: string,
    highlight: boolean,
    image: string,
    category: string,
    select: Date,
    date_hour?: number,
    date_minute?: number,
  ) {
    let alterTime = null;

    const selectDate = dayjs(select).tz('Asia/Seoul');

    if (!!date_hour && !!date_minute) {
      alterTime = selectDate.hour(date_hour).minute(date_minute).toDate(); // Convert to local time
    } else {
      alterTime = dayjs(this.createDateMaker(select)).toDate();
    }
    const updatePost = await this.prismaService.post.update({
      where: {
        id,
      },
      data: {
        title,
        content,
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

    return updatePost;
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일을 찾을 수 없습니다');
    }

    const imageUrl = `${
      process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : 'http://localhost:3065'
    }/uploads/${file.filename}`;
    return imageUrl; // 클라이언트에서 사용할 수 있도록 URL 반환
  }
  async pagenationFindAll(page: number, limit: number, category?: string) {
    const skip = (page - 1) * limit;

    return this.getPostsByCategoryOrAll(skip, limit, category);
  }

  async getPostsByCategoryOrAll(
    skip: number,
    limit: number,
    category?: string,
  ) {
    try {
      const whereClause = {
        ...(category ? { categoryId: category } : {}),
      };

      const findCategoryAll = this.prismaService.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalCategory = this.prismaService.post.count({
        where: whereClause,
      });

      const [items, total] = await Promise.all([
        findCategoryAll,
        totalCategory,
      ]);
      return {
        items,
        total,
      };
    } catch (err) {
      console.error(err);
      throw Error(err);
    }
  }
}
