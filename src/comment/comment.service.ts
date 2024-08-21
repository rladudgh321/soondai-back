import {
  BadRequestException,
  ConflictException,
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
export class CommentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async addComment(
    content: string,
    token: string,
    param: string,
    select: Date,
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
            userId: user.id,
          },
        },
      },
    });

    const likeCount = await this.prismaService.commentOnUser.count({
      where: { likeId: commentId },
    });

    const HeartOrNot = await this.prismaService.commentOnUser.findUnique({
      where: {
        userId_likeId: {
          userId: user.id,
          likeId: commentId,
        },
      },
    });

    console.log('heartornot', HeartOrNot.userId);
    console.log('comment like count', likeCount);

    return { heartOrNot: HeartOrNot.userId, count: likeCount, userId: user.id };
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
    const existingLike = await this.prismaService.commentOnUser.findUnique({
      where: {
        userId_likeId: {
          userId: user.id,
          likeId: commentId,
        },
      },
    });

    if (!existingLike) {
      throw new ConflictException('좋아요가 추가된 댓글이 아닙니다');
    }

    const deleteLikeComment = await this.prismaService.commentOnUser.delete({
      where: {
        userId_likeId: {
          userId: user.id,
          likeId: commentId,
        },
      },
    });

    return deleteLikeComment;
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

  async getComment(token: string, param: string) {
    console.log('****back token, param', token, param);
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });
    const user = await this.prismaService.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new NotFoundException('작성자를 찾을 수 습니다.');
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

    console.log('!!!!!!!!!!!');

    // commentOnUser의 userId 값을 추가해서 리턴해주기

    comment.map(
      async (v) =>
        await this.prismaService.commentOnUser.findUnique({
          where: {
            userId_likeId: {
              userId: user.id,
              likeId: v.id,
            },
          },
        }),
    );

    // return할 곳에 likers: [{id:1}, {id:2}] 형식으로 리턴을해라

    const mapComment = await Promise.all(
      comment.map(
        async ({
          id,
          user: { profile, name },
          createdAt,
          content,
          parentId,
        }) => {
          return {
            id,
            profile,
            name,
            createdAt,
            content,
            parentId,
            commentLikeCount: await this.prismaService.commentOnUser.count({
              where: {
                likeId: id,
              },
            }),
            userId: await this.prismaService.commentOnUser.findUnique({
              where: {
                userId_likeId: {
                  userId: user.id,
                  likeId: id,
                },
              },
            }),
          };
        },
      ),
    );

    // const hi = await Promise.all(
    //   mapComment.map(async (v) => {
    //     const userId = await this.prismaService.commentOnUser.findUnique({
    //       where: {
    //         userId_likeId: {
    //           userId: user.id,
    //           likeId: v.id,
    //         },
    //       },
    //     });
    //     return userId;
    //   }),
    // );

    // console.log('hi', hi);

    //   const posts = await prisma.profile
    // .findUnique({
    //   where: { id: 1 },
    // })
    // .user()
    // .posts()

    // const userIdInCommentOnUserModel = await this.prismaService.comment
    //   .findMany({
    //     where: {
    //       postId: param,
    //     },
    //   })

    // .likeUsers();

    // const userIdInCommentOnUserModel =
    //   await this.prismaService.commentOnUser.findUnique({
    //     where: {
    //       userId_likeId: {
    //         userId: user.id,
    //         likeId: 'dd',
    //       },
    //     },
    //   });

    return mapComment;
  }

  async getCommenta(token: string, param: string, parentId: string) {
    console.log('****back token, param', token, param);
    const decoded = this.jwtService.verify(token.slice(7), {
      secret: this.configService.get('jwt').secret,
    });
    const user = await this.prismaService.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new NotFoundException('작성자를 찾을 수 습니다.');
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
            profile: true,
            name: true,
          },
        },
      },
    });

    console.log('!!!!!!!!!!!');

    return comment.map(
      ({ id, user: { profile, name }, createdAt, content, parentId }) => {
        return {
          id,
          profile,
          name,
          createdAt,
          content,
          parentId,
        };
      },
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

    //댓글쓴자 === 로그인사용자가 아니라면...
    if (comment.userId !== user.id)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    await this.prismaService.comment.deleteMany({
      where: { parentId: commentId },
    });

    await this.prismaService.comment.delete({
      where: { id: comment.id },
    });

    return {
      postId: postId,
      commentId: comment.id,
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
