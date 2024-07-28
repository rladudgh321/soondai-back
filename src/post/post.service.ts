import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
  ) {}
  async addpost(title: string, content: string, token: string) {
    const decoded = this.jwtService.decode(token);
    const user = await this.prismaService.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new NotFoundException('작성자를 찾을 수 없습니다.');
    }

    const post = await this.prismaService.post.create({
      data: {
        title,
        content,
        author: { connect: { id: user.id } },
      },
    });

    return post;
  }

  async getPosts() {
    const posts = await this.prismaService.post.findMany();
    return posts;
  }

  async getPost(id: string, token: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id },
    });

    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');

    const decoded = this.jwtService.decode(token);
    if (post.authorId !== decoded?.sub)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    return post;
  }

  async removePost(id: string, data: string) {
    const post = await this.prismaService.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');

    const userId = this.jwtService.decode(data).sub;

    const user = await this.userService.findOne(userId);

    if (user.role === Role.Admin) {
      return this.removePostByAdmin(id);
    }

    if (post.authorId !== userId)
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

  async updatePost(id: string, title: string, content: string, token: string) {
    const post = await this.prismaService.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');

    const userId = this.jwtService.decode(token).sub;

    const user = await this.userService.findOne(userId);

    if (user.role === Role.Admin) {
      return this.updatePostByAdmin(id, title, content, token);
    }

    if (post.authorId !== userId)
      throw new UnauthorizedException('허용되지 않은 방법입니다');

    const updatePost = await this.prismaService.post.update({
      where: {
        id,
      },
      data: {
        title,
        content,
      },
      include: {
        author: true,
      },
    });

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

  async uploadImage(token: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일을 찾을 수 없습니다');
    }

    const decoded = await this.jwtService.decode(token);

    const user = await this.prismaService.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) throw new NotFoundException('허용되지 않은 사용자입니다');

    return file.path;
  }
}
