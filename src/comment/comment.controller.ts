import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommentService } from './comment.service';
import {
  addCommentReqDto,
  addLikeCommentReqDto,
  getCommentReqDto,
  getLikeCommentReqDto,
  removeCommentReqDto,
} from './dto/req.dto';
import {
  addCommentResDto,
  addLikeCommentResDto,
  getCommentResDto,
  getLikeCommentResDto,
  removeCommentResDto,
  removeCommentsResDto,
} from './dto/res.dto';

@ApiTags('comment')
@ApiExtraModels(addCommentResDto, getCommentResDto)
@Controller('comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly prismaService: PrismaService,
  ) {}

  @ApiPostResponse(addLikeCommentResDto)
  @ApiBearerAuth()
  @Patch(':param/:commentId')
  async addLikeComment(
    @Headers('authorization') token: string,
    @Param() { param, commentId }: addLikeCommentReqDto,
  ): Promise<addLikeCommentResDto> {
    const comment = await this.commentService.addLikeComment(
      token,
      param,
      commentId,
    );
    return comment;
  }

  // @ApiPostResponse()
  @ApiBearerAuth()
  @Delete('/like/:param/:commentId')
  async removeLikeComment(
    @Headers('authorization') token: string,
    @Param() { param, commentId }: addLikeCommentReqDto,
  ): Promise<any> {
    const comment = await this.commentService.removeLikeComment(
      token,
      param,
      commentId,
    );
    return comment;
  }

  // @ApiPostResponse()
  @ApiBearerAuth()
  @Delete('/post/like/:param/:commentId')
  async ifDeletePost_deleteManyLike(
    @Headers('authorization') token: string,
    @Param() { param, commentId }: addLikeCommentReqDto,
  ): Promise<any> {
    const comment = await this.commentService.ifDeletePost_deleteManyLike(
      token,
      param,
      commentId,
    );
    return comment;
  }

  // @ApiPostResponse()
  @ApiBearerAuth()
  @Delete('/origin/like/:param/:commentId')
  async ifOriginremoveComment_removeWithItsParentId(
    @Headers('authorization') token: string,
    @Param() { param, commentId }: addLikeCommentReqDto,
  ): Promise<any> {
    const comment =
      await this.commentService.ifOriginremoveComment_removeWithItsParentId(
        token,
        param,
        commentId,
      );
    return comment;
  }

  @ApiBearerAuth()
  @Delete('/deleteOne/:postId/:commentId')
  async removeComment(
    @Param() { postId, commentId }: removeCommentReqDto,
    @Headers('authorization') token: string,
  ): Promise<removeCommentResDto> {
    console.log('removeComment', token);
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

  @ApiPostResponse(getCommentResDto)
  @ApiBearerAuth()
  @Public()
  @Get('/commentDaetgeul/:param/:parentId') // param은 postId
  async getCommenta(
    @Headers('authorization') token: string,
    @Param() { param, parentId }: getCommentReqDto,
  ): Promise<any> {
    console.log('************************************', token, param);
    console.log(token, param, parentId);
    const comment = await this.commentService.getCommenta(
      token,
      param,
      parentId,
    );
    const commentWithParentId = comment.filter((v) => v.parentId !== null);
    return commentWithParentId;
  }

  @ApiPostResponse(getCommentResDto)
  @ApiBearerAuth()
  @Public()
  @Get(':param') // param은 postId
  async getComment(
    @Headers('authorization') token: string | null,
    @Param('param') param: string,
    // @Param() { param }: getCommentReqDto,
  ): Promise<any> {
    console.log('************************************', token, param);
    const comment = await this.commentService.getComment(token, param);
    const commentWithoutParentId = comment.filter((v) => v.parentId === null);
    return commentWithoutParentId;
  }

  @ApiPostResponse(getLikeCommentResDto)
  @ApiBearerAuth()
  @Get('/like/:param/:commentId')
  async getLikeComment(
    @Headers('authorization') token: string,
    @Param() { param, commentId }: getLikeCommentReqDto,
  ): Promise<any> {
    const comment = await this.commentService.getLikeComment(
      token,
      param,
      commentId,
    );
    return comment;
  }

  @ApiPostResponse(addCommentResDto)
  @ApiBearerAuth()
  @Post(':param')
  async addComment(
    @Body() { content, select, date_hour, date_minute }: addCommentReqDto,
    @Headers('authorization') token: string,
    @Param() { param }: addCommentReqDto,
  ): Promise<addCommentResDto> {
    const comment = await this.commentService.addComment(
      content,
      token,
      param,
      select,
      date_hour,
      date_minute,
    );
    return {
      profile: comment.user.profile,
      name: comment.user.name,
      createdAt: comment.createdAt,
      content: comment.content,
    };
  }

  @ApiPostResponse(addCommentResDto)
  @ApiBearerAuth()
  @Post(':param/:parentId')
  async addCommenta(
    @Body() { content, select }: addCommentReqDto,
    @Headers('authorization') token: string,
    @Param() { param, parentId }: addCommentReqDto,
  ): Promise<addCommentResDto> {
    const comment = await this.commentService.addCommenta(
      content,
      token,
      param,
      select,
      parentId,
    );
    return {
      profile: comment.user.profile,
      name: comment.user.name,
      createdAt: comment.createdAt,
      content: comment.content,
    };
  }

  // @ApiBearerAuth()
  // @Delete(':postId/deleteComments')
  // async removeComments(
  //   @Param('postId') postId: string,
  //   @Headers('authorization') token: string,
  // ): Promise<removeCommentsResDto> {
  //   console.log('removeCommentsremoveCommentsremoveCommentsremoveComments');
  //   console.log('removeComment', token, postId);
  //   const post = await this.prismaService.post.findUnique({
  //     where: { id: postId },
  //   });

  //   if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');
  //   console.log('*removeComments* 서비스 들어가기 전');
  //   const comment = await this.commentService.removeComments(postId, token);
  //   // count obejct { count : 3}
  //   console.log('removeComment return', comment);
  //   return { count: comment.count };
  // }

  @ApiBearerAuth()
  @Delete(':postId/deleteComments')
  async removeComments(
    @Param('postId') postId: string,
    @Headers('authorization') token: string,
  ): Promise<removeCommentsResDto> {
    console.log('removeCommentsremoveCommentsremoveCommentsremoveComments');
    console.log('removeComment', token, postId);
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('게시글이 존재하지 않습니다');
    console.log('*removeComments* 서비스 들어가기 전');
    const comment = await this.commentService.removeComments(postId, token);
    // count obejct { count : 3}
    console.log('removeComment return', comment);
    return { count: comment.count };
  }
}
