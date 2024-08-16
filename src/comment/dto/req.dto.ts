import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class addCommentReqDto {
  @ApiProperty({ required: true, title: '게시글 아이디' })
  param: string;

  @ApiPropertyOptional({ title: '부모 댓글 아이디' })
  parentId?: string;

  @ApiProperty({ required: true, title: '댓글', example: '댓글입니다' })
  content: string;

  @ApiPropertyOptional({ title: '선택 시간' })
  select?: Date;
}

export class getCommentReqDto {
  @ApiProperty({
    required: true,
    example: 'b5b23008-a983-4ccf-8869-0d61533258f9',
  })
  param: string;

  @ApiProperty({
    required: true,
    example: 'b5b23008-a983-4ccf-8869-0d61533258f9',
  })
  parentId: string;
}

export class removeCommentReqDto {
  @ApiProperty({
    required: true,
    example: 'b5b23008-a983-4ccf-8869-0d61533258f9',
  })
  postId: string;

  @ApiProperty({
    required: true,
    example: 'b5b23008-a983-4ccf-8869-0d61533258f9',
  })
  commentId: string;
}

export class removeCommentsReqDto {
  @ApiProperty({
    required: true,
    example: 'b5b23008-a983-4ccf-8869-0d61533258f9',
  })
  postId: string;
}
