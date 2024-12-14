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
  @Get('/navCount')
  async navCount(): Promise<any> {
    return this.postService.navCount();
  }

  @Public()
  @ApiBearerAuth()
  @Get('/pagination')
  async pagenationFindAll(
    @Query() { page = 1, limit = 10, category }: pagenationReqDto,
  ): Promise<any> {
    console.log('page: ', page, 'limit: ', limit, 'category: ', category);
    return this.postService.pagenationFindAll(page, limit, category);
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
      highlight,
      image,
      categories,
      select,
      date_hour,
      date_minute,
    }: addpostReqDto,
  ): Promise<any> {
    const post = await this.postService.addpost(
      title,
      content,
      token,
      highlight,
      image,
      categories,
      select,
      date_hour,
      date_minute,
    );
    return post;
  }

  @ApiBearerAuth()
  @Delete(':id')
  async removePost(
    @Param('id') id: string,
    @Headers('authorization') data: string,
  ): Promise<RemovePostResDto> {
    const post = await this.postService.removePost(id, data);
    return { id: post.id };
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
      highlight,
      image,
      categories,
      select,
      date_hour,
      date_minute,
    }: UpdatePostReqDto,
  ): Promise<any> {
    console.log('back updatePost', categories);
    console.log('update token', token);
    const post = await this.postService.updatePost(
      params,
      title,
      content,
      token,
      highlight,
      image,
      categories,
      select,
      date_hour,
      date_minute,
    );
    return post;
  }

  @ApiPostResponse(UpdatePostResDto)
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Patch(':params/admin')
  async updatePostByAdmin(
    @Param() { params }: UpdatePostReqDto,  // 게시글 ID
    @Headers('authorization') token: string,  // Authorization Token
    @Body() { title, content, highlight, image, categories, select }: UpdatePostReqDto,  // 요청 본문에서 전달된 데이터
  ): Promise<any> {
    // 관리자 권한 체크는 @Roles(Role.Admin) 데코레이터에서 처리됨
    // 토큰을 검증하여 권한을 가진 사용자인지 확인하는 부분은 서비스 내부에서 처리됨
  
    const post = await this.postService.updatePost(
      params,      // 게시글 ID
      title,       // 제목
      content,     // 내용
      token,       // Authorization Token
      highlight,   // 하이라이트 여부
      image,       // 이미지 URL
      categories,  // 카테고리 배열 (ID 및 이름 포함)
      select,      // 선택된 시간
    );
  
    // 게시글 업데이트 후 수정된 제목과 내용을 반환
    return { title: post.title, content: post.content };
  }
  

  // 경로 위치 조심
  @Public()
  @Post(':id')
  async getPost(
    @Param() { id }: getPostReqDto,
    @Body() { token }: getPostReqDto,
  ): Promise<GetPostReqDto> {
    const post = await this.postService.getPost(id, token);
    return { id, title: post.title, content: post.content };
  }
}
