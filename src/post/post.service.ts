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
    categories:  { id: string; name: string }[],  // multiple category IDs
    select: Date,
    date_hour?: number,
    date_minute?: number,
  ) {
    // JWT 토큰에서 사용자 정보 추출
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get('jwt').secret,
    });
  
    // 작성자 확인
    const user = await this.prismaService.user.findUnique({
      where: { id: decoded.sub },
    });
  
    if (!user) {
      throw new NotFoundException('작성자를 찾을 수 없습니다.');
    }
  
    // 카테고리들이 존재하는지 확인
    if (!categories.length) {
      throw new NotFoundException('하나 이상의 카테고리가 존재하지 않습니다.');
    }
  
    const categoryId = categories.map(category => category.id);
    console.log('addPost categoryId', categoryId);

    // 카테고리들이 실제로 존재하는지 확인
    const existingCategories = await this.prismaService.category.findMany({
      where: {
        id: { in: categoryId }, // 주어진 카테고리 ID 배열을 기준으로 카테고리들 검색
      },
    });

    console.log('existingCategories', existingCategories);
  
    if (existingCategories.length !== categories.length) {
      throw new NotFoundException('제공된 카테고리 중 일부가 존재하지 않습니다.');
    }
  
    // 시간 설정
    let alterTime = null;
    const selectDate = dayjs(select).tz('Asia/Seoul');
  
    if (date_hour && date_minute) {
      alterTime = selectDate
        .hour(date_hour)
        .minute(date_minute)
        .toDate(); // 선택한 시간으로 변환
    } else {
      alterTime = dayjs(this.createDateMaker(select)).toDate();
    }
  
    const date = dayjs(alterTime).format();
  
    // 포스트 생성
    const post = await this.prismaService.post.create({
      data: {
        title,
        content,
        highlight,
        image,
        select,
        author: {
          connect: { id: user.id }, // 작성자 연결
        },
        categories: {
          connect: existingCategories.map((category) => ({ id: category.id })), // 실제 존재하는 카테고리 연결
        },
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
        categories: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return posts;
  }

  async navCount() {
    const categoryCounts = await this.prismaService.category.findMany({
      include: {
        _count: {
          select: { posts: true },  // posts 관계의 카운트를 포함
        },
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
    categories: { id: string; name: string }[],  // 여러 카테고리 ID 배열
    select: Date,
    date_hour?: number,
    date_minute?: number,
  ): Promise<any> {
    const decoded = this.jwtService.verify(token.split(' ')[1], {
      secret: this.configService.get('jwt').secret,
    });
  
    const user = await this.userService.findOne(decoded.sub);
    
    // 게시글을 찾고 카테고리 연결을 수정하는 부분
    const post = await this.prismaService.post.findUnique({
      where: { id: params },
      include: { categories: true },  // 기존에 연결된 카테고리들을 포함
    });
    
    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');
    
    // 카테고리 정보가 누락된 경우 처리
    if (!categories || categories.length === 0) {
      throw new NotFoundException('카테고리 정보가 누락되었습니다');
    }
  
    // 관리자 권한 체크 (Admin 역할인 경우)
    if (user.role === Role.Admin) {
      return this.updatePostInternal(
        params,
        title,
        content,
        highlight,
        image,
        categories,
        select,
        date_hour,
        date_minute,
      );
    }
  
    // 일반 사용자 권한 체크
    if (post.authorId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');
  
    return this.updatePostInternal(
      params,
      title,
      content,
      highlight,
      image,
      categories,
      select,
      date_hour,
      date_minute,
    );
  }
  
  private async updatePostInternal(
    id: string,
    title: string,
    content: string,
    highlight: boolean,
    image: string,
    categories: { id: string; name: string }[],  // 여러 개의 카테고리
    select: Date,
    date_hour?: number,
    date_minute?: number,
  ): Promise<any> {
    let alterTime = null;
    
    const selectDate = dayjs(select).tz('Asia/Seoul');
    
    // 시간 설정
    if (!!date_hour && !!date_minute) {
      alterTime = selectDate
        .hour(date_hour)
        .minute(date_minute)
        .toDate(); // 선택한 시간으로 변환
    } else {
      alterTime = dayjs(this.createDateMaker(select)).toDate(); // 기본 선택 시간
    }
  
    console.log('updatePostInternal categories', categories);
  
    // 기존 카테고리 아이디 추출
    const currentCategoryIds = categories.map((category) => category.id);
  
    // 현재 게시글에서 연결된 카테고리 아이디 추출
    const currentPostCategories = await this.prismaService.post.findUnique({
      where: { id },
      select: { categories: { select: { id: true } } },
    });
  
    // 기존 카테고리 ID 리스트
    const currentPostCategoryIds = currentPostCategories?.categories.map(c => c.id) || [];
  
    // 기존 카테고리와 새 카테고리 비교하여 `disconnect`할 카테고리들
    const disconnectCategories = currentPostCategoryIds
      .filter((categoryId) => !currentCategoryIds.includes(categoryId))  // 기존 카테고리 중 새 카테고리와 일치하지 않는 것들
      .map((categoryId) => ({ id: categoryId }));
  
    console.log('disconnectCategories:', disconnectCategories);
  
    // 포스트 업데이트
    const updatePost = await this.prismaService.post.update({
      where: { id },
      data: {
        title,
        content,
        highlight,
        image,
        categories: {
          // 기존 카테고리 연결 끊기
          disconnect: disconnectCategories, // disconnect 대상 카테고리
          // 새 카테고리 연결
          connect: categories.map((category) => ({ id: category.id })),
        },
        select,
        createdAt: alterTime, // 선택한 시간
        updatedAt: dayjs(Date.now()).toDate(), // 현재 시간
      },
    });
  
    console.log('updatePost', updatePost);
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
  
    // getPostsByCategoryOrAll에 categories 배열을 넘겨서 호출
    return this.getPostsByCategoryOrAll(skip, limit, category);
  }
  

  async getPostsByCategoryOrAll(
    skip: number,
    limit: number,
    categories?: string // 카테고리 필터링을 위한 단일 카테고리 ID (또는 쉼표로 구분된 여러 카테고리 ID)
  ) {
    try {
      // 카테고리가 주어졌다면, 해당 카테고리를 기준으로 게시글을 필터링
      const whereClause = categories
        ? {
            categories: {
              some: {
                id: { in: categories.split(',') }, // 여러 카테고리 처리 시 쉼표로 구분된 문자열을 배열로 변환
              },
            },
          }
        : {}; // 카테고리가 없다면 모든 게시글을 반환
  
      // 게시글을 카테고리 필터링 조건과 함께 조회
      const findCategoryAll = this.prismaService.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc', // 최신 게시글부터 정렬
        },
        include: {
          categories: true, // 게시글과 관련된 카테고리 정보 포함
        },
      });
  
      // 전체 게시글 수를 계산
      const totalCategory = this.prismaService.post.count({
        where: whereClause,
      });
  
      const [items, total] = await Promise.all([findCategoryAll, totalCategory]);
  
      return {
        items,
        total,
      };
    } catch (err) {
      console.error(err);
      throw Error(err); // 에러 처리
    }
  }
  
}
