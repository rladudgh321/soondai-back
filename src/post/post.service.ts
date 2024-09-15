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

    // await this.prismaService.commentOnUser.deleteMany({
    //   where: { postId: id },
    // });

    // await this.prismaService.comment.deleteMany({
    //   where: { postId: id },
    // });

    const removePost = await this.prismaService.post.delete({ where: { id } });

    return {
      id: removePost.id,
    };
  }

  async removePostByAdmin(id: string) {
    // await this.prismaService.commentOnUser.deleteMany({
    //   where: { postId: id },
    // });

    // await this.prismaService.comment.deleteMany({
    //   where: { postId: id },
    // });

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

  //user.id가 없으면 return null;
  //user.id가 있고, admin사용자라면 그대로 리턴
  //user.id가 게시글 사용자와 같다면 그대로 리턴
  //그외는 return null;

  async pagenationFindAll(
    page: number,
    limit: number,
    token: string,
    category?: string,
  ) {
    let user = null;
    if (token.slice(7) !== 'null') {
      try {
        console.log('token 있습니다');
        // const cleanedToken = token.startsWith('Bearer ')
        //   ? token.slice(7)
        //   : token;

        // 비밀키와 함께 비동기적으로 JWT를 검증합니다
        const decoded = this.jwtService.verify(token.slice(7), {
          secret: this.configService.get('jwt').secret,
        });
        user = await this.prismaService.user.findUnique({
          where: { id: decoded.sub },
          include: {
            posts: true,
          },
        });
      } catch (err) {
        console.log('pagenationFindAll err', err);
        throw new Error(err);
      }
    } else {
      console.log('token 없습니다');
      user = null;
    }

    const skip = (page - 1) * limit;

    const isUser = user?.id;

    // const posts = user?.posts || [];

    const posts = await this.prismaService.post.findMany({
      where: {
        authorId: isUser,
      },
    });

    if (isUser) {
      console.log('login 함');
      if (user.role === Role.Admin) {
        console.log('admin User');
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
          // 전체 보여주기
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
      } else {
        try {
          const queries = posts.map(async (v) => {
            if (v.authorId === isUser) {
              // console.log(
              //   '로그인 유저와 글쓴이 유저가 동일인물',
              //   await this.getPostsByCategoryOrAll(
              //     category,
              //     skip,
              //     limit,
              //     isUser,
              //     true,
              //   ),
              // );
              console.log('isUser', isUser, 'v.author', v.authorId);
              console.log('로그인로그인로그인', category);
              return this.getPostsByCategoryOrAll(
                category,
                skip,
                limit,
                isUser,
                true,
              );
            } else {
              // console.log(
              //   '로그인 유저와 게시글 유저가 동일인물이 아님',
              //   await this.getPostsByCategoryOrAll(
              //     category,
              //     skip,
              //     limit,
              //     isUser,
              //     false,
              //   ),
              // );

              return this.getPostsByCategoryOrAll(
                category,
                skip,
                limit,
                isUser,
                false,
              );
            }
          });

          const results = await Promise.all(queries);

          console.log('results', results);

          // 각 결과를 반환
          return results[0];
        } catch (err) {
          console.error(err);
          throw Error(err);
        }
      }
    } else {
      // 로그인 하지 않음
      // 카테고리 전체 보여주기
      console.log('아이디 없는 사람');
      if (category) {
        const findCategoryAll = this.prismaService.post.findMany({
          where: {
            categoryId: category,
            published: true,
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
            published: true,
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
        // 전체 보여주기
        const posts = this.prismaService.post.findMany({
          where: {
            published: true,
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        });

        const [items, total] = await Promise.all([
          posts,
          this.prismaService.post.count({
            where: {
              published: true,
            },
          }),
        ]);
        return {
          items,
          total,
        };
      }
    }
  }

  async getPostsByCategoryOrAll(
    category: string,
    skip: number,
    limit: number,
    loginUser: string,
    isUser: boolean,
  ) {
    try {
      // 로그인한 사용자가 게시글 작성자인지 확인하기 위한 쿼리
      const userPosts = await this.prismaService.post.findMany({
        where: {
          authorId: loginUser,
        },
      });

      // 로그인한 사용자가 작성한 게시글이 있을 경우
      const isAuthor = userPosts.length > 0;

      const whereClause = {
        ...(category ? { categoryId: category } : {}),
        ...(isAuthor ? {} : { published: true }), // 비공개 게시글 제외
      };

      const findCategoryAll = this.prismaService.post.findMany({
        where: {
          ...whereClause,
          // 로그인한 사용자가 아닌 경우, 비공개 게시글 제외
          ...(isUser
            ? {}
            : {
                AND: [
                  { published: true }, // 공개된 게시글만
                  { authorId: { not: loginUser } }, // 다른 사용자의 게시글만
                ],
              }),
          // 로그인한 사용자가 작성자일 경우, 자신이 작성한 비공개 게시글도 포함
          ...(isUser
            ? {
                OR: [
                  { authorId: loginUser }, // 자신의 게시글
                  { published: true }, // 또는 공개된 게시글
                ],
              }
            : {}),
        },
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
