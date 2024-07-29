import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { Role } from 'src/user/enum/role.enum';
import {
  UpdatePostReqDto,
  UploadImageReqDto,
  addpostReqDto,
  getPostReqDto,
  removePostReqDto,
} from './dto/req.dto';
import {
  GetPostReqDto,
  RemovePostResDto,
  UpdatePostResDto,
  addpostResDto,
} from './dto/res.dto';
import { PostService } from './post.service';

@ApiTags('post')
@ApiExtraModels(addpostResDto, UpdatePostResDto)
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Public()
  @ApiBearerAuth()
  @Get('getposts')
  async getPosts() {
    const posts = await this.postService.getPosts();
    return posts;
  }

  @Public()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('upload')
  uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ): Promise<any> {
    console.log('back *********');
    console.log('file', file);
    return this.postService.uploadImage(file);
  }

  @ApiPostResponse(addpostResDto)
  @ApiBearerAuth()
  @Post('/')
  async addpost(
    @Body() { title, content, token }: addpostReqDto,
  ): Promise<addpostResDto> {
    const post = await this.postService.addpost(title, content, token);
    return {
      id: post.authorId,
      title: post.title,
      content: post.content,
      postId: post.id,
    };
  }

  @ApiBearerAuth()
  @Delete(':id')
  async removePost(
    @Param() { id }: removePostReqDto,
    @Body() { data }: removePostReqDto,
  ): Promise<RemovePostResDto> {
    console.log('delete', id);
    const post = await this.postService.removePost(id, data);
    return { id: post.id, title: post.title, content: post.content };
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Delete(':id/admin')
  async removePostByAdmin(@Param() { id }: removePostReqDto) {
    console.log('delete', id);
    const post = await this.postService.removePostByAdmin(id);
    return post;
  }

  @ApiPostResponse(UpdatePostResDto)
  @ApiBearerAuth()
  @Patch(':id')
  async updatePost(
    @Param() { id }: UpdatePostReqDto,
    @Body()
    { title, content, token }: UpdatePostReqDto,
  ): Promise<UpdatePostResDto> {
    const post = await this.postService.updatePost(id, title, content, token);
    return { id, title: post.title, content: post.content };
  }

  @ApiPostResponse(UpdatePostResDto)
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Patch(':id/admin')
  async updatePostByAdmin(
    @Param() { id }: UpdatePostReqDto,
    @Body()
    { title, content, token }: UpdatePostReqDto,
  ): Promise<UpdatePostResDto> {
    const post = await this.postService.updatePost(id, title, content, token);
    return { id, title: post.title, content: post.content };
  }

  // 경로 위치 조심
  @Public()
  @ApiBearerAuth()
  @Post(':id')
  async getPost(
    @Param() { id }: getPostReqDto,
    @Body() { token }: getPostReqDto,
  ): Promise<GetPostReqDto> {
    console.log('back token', token);
    const post = await this.postService.getPost(id, token);
    return { id, title: post.title, content: post.content };
  }
}
