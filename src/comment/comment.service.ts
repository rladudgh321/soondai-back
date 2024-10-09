import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { PostService } from 'src/post/post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/user/enum/role.enum';
import { UserService } from 'src/user/user.service';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class CommentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  async addComment(
    content: string,
    token: string,
    param: string,
    select: Date,
    date_hour: number,
    date_minute: number,
  ) {
    console.log('addComment content', content);
    if (content.length === 0) {
      throw new BadRequestException('필수값이 미입력 됨');
    }

    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
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
      alterTime = dayjs(this.postService.createDateMaker(select)).toDate();
    }
    const date = dayjs(alterTime).format();
    console.log('alterTime (Local Time)', dayjs(alterTime).format());
    console.log('alterTime (UTC)', dayjs(alterTime).utc().format());
    console.log('alterTime (ISO)', alterTime.toISOString()); // Log ISO string
    console.log('alterTime', alterTime);
    console.log('date', date);

    const comment = await this.prismaService.comment.create({
      data: {
        createdAt: alterTime,
        content,
        user: {
          connect: { email: user.email },
        },
        post: {
          connect: { id: param },
        },
      },
      select: {
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            profile: true,
          },
        },
      },
    });

    return comment;
  }

  async addCommenta(
    content: string,
    token: string,
    param: string,
    select: Date,
    parentId: string,
  ) {
    console.log('addComment content', content);
    if (content.length === 0) {
      throw new BadRequestException('필수값이 미입력 됨');
    }

    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }

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

    const comment = await this.prismaService.comment.create({
      data: {
        createdAt: alterTime,
        parent: { connect: { id: parentId } },
        content,
        user: {
          connect: { email: user.email },
        },
        post: {
          connect: { id: param },
        },
      },
      select: {
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            profile: true,
          },
        },
      },
    });

    return comment;
  }

  async addLikeComment(token: string, param: string, commentId: string) {
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }

    // 댓글의 기존 좋아요 확인
    const existingLike = await this.prismaService.commentOnUser.findUnique({
      where: {
        userId_likeId: {
          userId: user.id,
          likeId: commentId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('이미 좋아요가 추가된 댓글입니다');
    }

    await this.prismaService.comment.update({
      where: { id: commentId },
      data: {
        likeUsers: {
          create: {
            postId: param,
            userId: user.id,
          },
        },
      },
    });

    const likeCount = await this.prismaService.commentOnUser.count({
      where: { likeId: commentId },
    });

    const userId = await this.prismaService.commentOnUser.findUnique({
      where: {
        userId_likeId: {
          userId: user.id,
          likeId: commentId,
        },
      },
    });

    console.log('comment like count', likeCount);

    return { userId: userId.userId, count: likeCount };
  }

  async removeLikeComment(token: string, param: string, commentId: string) {
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }

    // 댓글의 기존 좋아요 확인
    // const existingLike = await this.prismaService.commentOnUser.findUnique({
    //   where: {
    //     userId_likeId: {
    //       userId: user.id,
    //       likeId: commentId,
    //     },
    //   },
    // });

    // if (!existingLike) {
    //   throw new ConflictException('좋아요가 추가된 댓글이 아닙니다');
    // }

    //로그인 유저 아이디 한정하여 삭제.. 다른 유저는 삭제 안됨
    const likeComment = await this.prismaService.commentOnUser.findMany({
      where: {
        postId: param,
      },
    });

    if (likeComment.length === 0) {
      return false;
    }

    // if (user.role === Role.Admin) {
    //   const deleteLikeComment =
    //     await this.prismaService.commentOnUser.deleteMany({
    //       where: {
    //         likeId: commentId,
    //       },
    //     });
    //   return deleteLikeComment;
    // }

    const deleteLikeComment = await this.prismaService.commentOnUser.delete({
      where: {
        userId_likeId: {
          userId: user.id,
          likeId: commentId,
        },
      },
    });

    // const comments = await this.prismaService.comment.findMany({
    //   where: { parentId: commentId },
    // });

    // const comment = await this.prismaService.comment.findUnique({
    //   where: { id: commentId },
    // });

    // const commentIds = comments.map((v) => v.id);

    // await this.prismaService.commentOnUser.deleteMany({
    //   where: {
    //     likeId: commentId,
    //   },
    // });

    return deleteLikeComment;
  }

  async ifDeletePost_deleteManyLike(token: string, param: string) {
    console.log('mutationIfDeletePost_deleteManyLike');
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }

    //로그인유저가 Admin일 경우
    if (user.role === Role.Admin) {
      const ifDeletePost_deleteManyLike =
        await this.prismaService.commentOnUser.deleteMany({
          where: {
            postId: param,
          },
        });

      return ifDeletePost_deleteManyLike;
    }

    //게시글 글쓴이와 로그인사용자가 동일인물이 아닐시 에러

    if (user.id !== post.authorId) {
      throw new UnauthorizedException('허용되지 않은 방식입니다');
    }

    const ifDeletePost_deleteManyLike =
      await this.prismaService.commentOnUser.deleteMany({
        where: {
          postId: param,
        },
      });

    return ifDeletePost_deleteManyLike;
  }

  async ifOriginremoveComment_removeWithItsParentId(
    token: string,
    param: string,
    commentId: string,
  ) {
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }

    const comment = await this.prismaService.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    // admin 시 허용
    if (Role.Admin === user.role) {
      return this.deleteCommentsAll(commentId);
    }

    //comment parentId !== loginUser
    if (comment.userId !== user.id) {
      new UnauthorizedException('허용되지 않은 방법입니다');
    }

    return this.deleteCommentsAll(commentId);
  }

  async deleteCommentsAll(commentId: string) {
    const comments = await this.prismaService.comment.findMany({
      where: { parentId: commentId },
    });

    const commentIds = comments.map((v) => v.id);

    const deleteParentLikeComment = this.prismaService.commentOnUser.deleteMany(
      {
        where: {
          likeId: commentId,
        },
      },
    );

    // const deleteParentLikeComment = this.prismaService.commentOnUser.delete({
    //   where: {
    //     userId_likeId: {
    //       likeId: commentId,
    //       userId,
    //     },
    //   },
    // });

    //대댓글 좋아요 전부 삭제
    if (commentIds.length > 0) {
      const deleteLikeComment = this.prismaService.commentOnUser.deleteMany({
        where: {
          likeId: {
            in: commentIds,
          },
        },
      });
      await Promise.all([deleteParentLikeComment, deleteLikeComment]);
      return deleteLikeComment;
    } else {
      return await deleteParentLikeComment;
    }
  }

  async getLikeComment(token: string, param: string, commentId: string) {
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }

    // const likeCount = await this.prismaService.commentOnUser.count({
    //   where: { likeId: commentId },
    // });

    // 댓글의 좋아요수 ==> 댓글아이디, 댓글좋아요사용자아이디
    // const likeCount = await this.prismaService.commentOnUser.count({
    //   where: {
    //     likeId: commentId,
    //   }
    // })

    const HeartOrNot = await this.prismaService.commentOnUser.findUnique({
      where: {
        userId_likeId: {
          userId: user.id,
          likeId: commentId,
        },
      },
    });

    console.log('**heartornot**', HeartOrNot);
    console.log('heartornot', HeartOrNot?.userId);
    // console.log('comment like count', likeCount);

    return {
      userId: HeartOrNot?.userId,
      likeId: HeartOrNot.likeId,
      // count: likeCount,
    };
  }

  async getComment(token: string | null, param: string) {
    console.log('****back token, param', token, param);
    let user = null;
    let decoded = null;

    if (token !== 'Bearer null') {
      console.log('토큰 있을 경우', token);
      decoded = this.jwtService.verify(token?.slice(7), {
        secret: this.configService.get('jwt').secret,
      });
      user = await this.prismaService.user.findUnique({
        where: { id: decoded?.sub },
      });
      console.log('user null', user);
    } else {
      console.log('토큰 없을 경우');
      console.log('token', token);
      user = null;
    }

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }
    const comment = await this.prismaService.comment.findMany({
      where: { postId: param },
      include: {
        user: {
          select: {
            profile: true,
            name: true,
            id: true,
          },
        },
        likeUsers: true,
      },
    });

    const mapComment = await Promise.all(
      comment.map(
        async ({
          id,
          user: { profile, name, id: loginUserId },
          createdAt,
          content,
          parentId,
        }) => {
          const userId = await this.prismaService.commentOnUser.findUnique({
            where: {
              userId_likeId: {
                userId: user?.id,
                likeId: id,
              },
            },
          });
          console.log('Promise userId', userId);
          return {
            id,
            profile,
            name,
            createdAt,
            content,
            parentId,
            authorId: loginUserId,
            commentCount: await this.prismaService.comment.count({
              where: {
                parentId: id,
              },
            }),
            commentLikeCount: await this.prismaService.commentOnUser.count({
              where: {
                likeId: id,
              },
            }),
            userId,
          };
        },
      ),
    );

    return mapComment;
  }

  async getCommentPagination(
    token: string | null,
    param: string,
    page?: number,
    limit?: number,
  ) {
    console.log('****back token, param', token, param);
    let user = null;
    let decoded = null;

    if (token !== 'Bearer null') {
      console.log('토큰 있을 경우', token);
      decoded = this.jwtService.verify(token?.slice(7), {
        secret: this.configService.get('jwt').secret,
      });
      user = await this.prismaService.user.findUnique({
        where: { id: decoded?.sub },
      });
      console.log('user null', user);
    } else {
      console.log('토큰 없을 경우');
      console.log('token', token);
      user = null;
    }

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }

    const skip = (page - 1) * limit;

    return this.getCommentsByPostPagination(skip, limit, param);
  }

  async getCommentsByPostPagination(
    skip: number,
    limit: number,
    param: string,
  ) {
    try {
      const commentWithoutParentId = await this.prismaService.comment.findMany({
        where: { parentId: null, postId: param },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
        },
      });

      const mapComment = Promise.all(
        commentWithoutParentId.map(
          async ({
            id,
            user: { profile, name, id: loginUserId },
            createdAt,
            content,
            parentId,
          }) => {
            const userId = await this.prismaService.commentOnUser.findUnique({
              where: {
                userId_likeId: {
                  userId: loginUserId,
                  likeId: id,
                },
              },
            });
            return {
              id,
              profile,
              name,
              createdAt,
              content,
              parentId,
              authorId: loginUserId,
              commentCount: await this.prismaService.comment.count({
                where: {
                  parentId: id,
                },
              }),
              commentLikeCount: await this.prismaService.commentOnUser.count({
                where: {
                  likeId: id,
                },
              }),
              userId,
            };
          },
        ),
      );

      const totalCategory = this.prismaService.comment.count({
        where: { parentId: null, postId: param },
      });

      const [items, total] = await Promise.all([mapComment, totalCategory]);

      console.log('itemsitems', items);

      return {
        items,
        total,
      };
    } catch (err) {
      console.error(err);
      throw Error(err);
    }
  }

  async getCommenta(token: string, param: string, parentId: string) {
    console.log('****back token, param', token, param);

    let user = null;
    let decoded = null;

    if (token !== 'Bearer null') {
      console.log('토큰 있을 경우', token);
      decoded = this.jwtService.verify(token?.slice(7), {
        secret: this.configService.get('jwt').secret,
      });
      user = await this.prismaService.user.findUnique({
        where: { id: decoded?.sub },
      });
      console.log('user null', user);
    }

    const post = await this.prismaService.post.findUnique({
      where: {
        id: param,
      },
    });

    if (!post) {
      throw new ConflictException('존재하지 않은 게시글입니다');
    }
    const comment = await this.prismaService.comment.findMany({
      where: { postId: param, parentId },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
            name: true,
          },
        },
      },
    });

    console.log('!!!!!!!!!!!');

    return Promise.all(
      comment.map(
        async ({
          id,
          user: { profile, name, id: loginUSerId },
          createdAt,
          content,
          parentId,
        }) => {
          const userId = user?.id
            ? await this.prismaService.commentOnUser.findUnique({
                where: {
                  userId_likeId: {
                    userId: user.id,
                    likeId: id,
                  },
                },
              })
            : null;
          console.log('commenta Promise userId', userId);
          return {
            id,
            profile,
            name,
            createdAt,
            content,
            parentId,
            authorId: loginUSerId,
            commentLikeCount: await this.prismaService.commentOnUser.count({
              where: {
                likeId: id,
              },
            }),
            userId,
          };
        },
      ),
    );
  }

  async removeComment(postId: string, commentId: string, token: string) {
    //토큰을 이용한 로그인사용자
    console.log('removeComment token key', token);

    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    if (user.role === Role.Admin) {
      // return this.removePostByAdmin(id);
    }

    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });

    if (user.role === Role.Admin) {
      return this.removeCommentByAdmin(postId, commentId);
    }

    //댓글쓴자 === 로그인사용자가 아니라면...
    if (comment.userId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    const deleteManys = this.prismaService.comment.deleteMany({
      where: { parentId: commentId },
    });

    const deleteOne = this.prismaService.comment.delete({
      where: { id: comment.id },
    });

    await Promise.all([deleteManys, deleteOne]);

    // //다른 유저들의 좋아요 삭제
    // await this.prismaService.commentOnUser.deleteMany({
    //   where: { likeId: commentId },
    // });

    return {
      postId: postId,
      commentId: comment.id,
    };
  }

  async removeDaetguelLikes(commentId: string, token: string) {
    //토큰을 이용한 로그인사용자
    console.log('removeComment token key', token);

    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    if (user.role === Role.Admin) {
      const removeDeatguelLikes =
        await this.prismaService.commentOnUser.deleteMany({
          where: {
            likeId: commentId,
          },
        });
      return removeDeatguelLikes;
    }

    //댓글쓴자 === 로그인사용자가 아니라면...
    if (comment.userId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    const removeDeatguelLikes =
      await this.prismaService.commentOnUser.deleteMany({
        where: {
          likeId: commentId,
        },
      });

    // //다른 유저들의 좋아요 삭제
    // await this.prismaService.commentOnUser.deleteMany({
    //   where: { likeId: commentId },
    // });

    return removeDeatguelLikes;
  }

  async removeCommentByAdmin(postId: string, commentId: string) {
    const deleteManys = this.prismaService.comment.deleteMany({
      where: { parentId: commentId },
    });

    const deleteOne = this.prismaService.comment.delete({
      where: { id: commentId },
    });

    await Promise.all([deleteManys, deleteOne]);

    return {
      postId: postId,
      commentId,
    };
  }

  async removeComments(postId: string, token: string) {
    console.log('removeComments 서비스 초입');
    console.log('removeComment token key', token);

    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });

    const user = await this.userService.findOne(decoded.sub);

    if (user.role === Role.Admin) {
      // return this.removePostByAdmin(id);
    }

    // const comment = await this.prismaService.comment.findUnique({
    //   where: { id: commentId },
    // });

    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });

    if (user.role === Role.Admin) {
      const comment = await this.prismaService.comment.deleteMany({
        where: { postId: post.id },
      });
      console.log('back server comment', comment);
      return comment;
    }

    //게시글쓴이 === 로그인사용자가 아니라면...
    if (post.authorId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    const comment = await this.prismaService.comment.deleteMany({
      where: { postId: post.id },
    });
    console.log('back server comment', comment);
    return comment;
  }
}
