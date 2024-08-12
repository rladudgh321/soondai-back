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

  async addComment(content: string, token: string, param: string) {
    if (content.length === 0) {
      throw new BadRequestException('필수값이 미입력 됨');
    }

    const decoded = this.jwtService.verify(token, {
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

    const comment = await this.prismaService.comment.create({
      data: {
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
          },
        },
      },
    });

    console.log('!!!!!!!!!!!');

    return comment.map(({ user: { profile, name }, createdAt, content }) => ({
      profile,
      name,
      createdAt,
      content,
    }));
  }

  async removeComment(postId: string, commentId: string, token: string) {
    //토큰을 이용한 로그인사용자
    const userId = this.jwtService.verify(token, {
      secret: this.configService.get('jwt'),
    }).sub;

    console.log('remove userId', userId);

    const user = await this.userService.findOne(userId);

    if (user.role === Role.Admin) {
      // return this.removePostByAdmin(id);
    }

    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });

    //댓글쓴자 === 로그인사용자가 아니라면...
    if (comment.userId !== userId)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    await this.prismaService.post.delete({
      where: { id: comment.id },
    });

    return {
      postId: postId,
      commentId: comment.id,
    };
  }
}
