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

    const alterTime = this.createDateMaker(select);

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
}
