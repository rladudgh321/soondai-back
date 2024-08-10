import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CommentService } from './comment.service';
import { addCommentResDto, getCommentResDto } from './dto/res.dto';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { addCommentReqDto, getCommentReqDto } from './dto/req.dto';

@ApiTags('comment')
@ApiExtraModels(addCommentResDto, getCommentResDto)
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

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
    @Headers() { token, param }: getCommentReqDto,
    // @Param() { param }: getCommentReqDto,
  ): Promise<any> {
    console.log('************************************');
    const comment = await this.commentService.getComment(token, param);
    console.log('************************************getComment', comment);
    return comment;
  }
}
