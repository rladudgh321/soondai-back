import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommentService } from './comment.service';
import { addCommentReqDto, removeCommentReqDto } from './dto/req.dto';
import {
  addCommentResDto,
  getCommentResDto,
  removeCommentResDto,
} from './dto/res.dto';

@ApiTags('comment')
@ApiExtraModels(addCommentResDto, getCommentResDto)
@Controller('comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly prismaService: PrismaService,
  ) {}

  @ApiPostResponse(addCommentResDto)
  @ApiBearerAuth()
  @Post(':param')
  async addComment(
    @Body() { content, token }: addCommentReqDto,
    @Param() { param }: addCommentReqDto,
  ): Promise<addCommentResDto> {
    const comment = await this.commentService.addComment(content, token, param);
    return {
      profile: comment.user.profile,
      name: comment.user.name,
      createdAt: comment.createdAt,
      content: comment.content,
    };
  }

  @ApiPostResponse(getCommentResDto)
  @ApiBearerAuth()
  @Get(':param') // param은 postId
  async getComment(
    @Headers('authorization') token: string,
    @Param('param') param: string,
    // @Param() { param }: getCommentReqDto,
  ): Promise<any> {
    console.log('************************************', token, param);
    const comment = await this.commentService.getComment(token, param);
    console.log('************************************getComment', comment);
    return comment;
  }

  @ApiBearerAuth()
  @Delete(':id')
  async removeComment(
    @Param() { postId, commentId }: removeCommentReqDto,
    @Headers('authorization') { token }: removeCommentReqDto,
  ): Promise<removeCommentResDto> {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');

    const comment = await this.commentService.removeComment(
      postId,
      commentId,
      token,
    );
    return { postId: comment.postId, commentId: comment.commentId };
  }
}
