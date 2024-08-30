import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Put,
  Query,
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
  addpostReqDto,
  getPostReqDto,
  pagenationReqDto,
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
  @Get('getposts')
  async getPosts(): Promise<any> {
    const posts = await this.postService.getPosts();
    return posts;
  }

  @Public()
  @Get('/pagination?page')
  async pagenationFindAll(
    @Query() { page = 1, limit = 10 }: pagenationReqDto,
  ): Promise<any> {
    return this.postService.pagenationFindAll(page, limit);
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
  ) {
    return this.postService.uploadImage(file);
  }

  @ApiPostResponse(addpostResDto)
  @ApiBearerAuth()
  @Post('/')
  async addpost(
    @Body()
    {
      title,
      content,
      token,
      published,
      highlight,
      image,
      category,
      select,
    }: addpostReqDto,
  ): Promise<any> {
    const post = await this.postService.addpost(
      title,
      content,
      token,
      published,
      highlight,
      image,
      category,
      select,
    );
    return post;
  }

  @ApiBearerAuth()
  @Delete(':id')
  async removePost(
    @Param('id') id: string,
    @Headers('authorization') data: string,
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
  @Put(':params')
  async updatePost(
    @Param() { params }: UpdatePostReqDto,
    @Headers('authorization') token: string,
    @Body()
    {
      title,
      content,
      published,
      highlight,
      image,
      category,
      select,
    }: UpdatePostReqDto,
  ): Promise<any> {
    const post = await this.postService.updatePost(
      params,
      title,
      content,
      token,
      published,
      highlight,
      image,
      category,
      select,
    );
    return post;
  }

  @ApiPostResponse(UpdatePostResDto)
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Patch(':params/admin')
  async updatePostByAdmin(
    @Param() { params }: UpdatePostReqDto,
    @Headers('authorization') token: string,
    @Body()
    {
      title,
      content,
      published,
      highlight,
      image,
      category,
      select,
    }: UpdatePostReqDto,
  ): Promise<any> {
    const post = await this.postService.updatePost(
      params,
      title,
      content,
      token,
      published,
      highlight,
      image,
      category,
      select,
    );
    return { title: post.title, content: post.content };
  }

  // 경로 위치 조심
  @Public()
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
