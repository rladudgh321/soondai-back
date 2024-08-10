import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
}
