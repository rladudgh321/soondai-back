import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class addCommentReqDto {
  @ApiProperty({ required: true })
  param: string;

  @ApiProperty({ required: true, title: '댓글', example: '댓글입니다' })
  content: string;

  @ApiProperty({ required: true })
  token: string;

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
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YzliYmJjNi1kYzVjLTRhMTYtYmFmMS1kYTQzNGRmNGMxZjUiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjMyOTcwNTgsImV4cCI6MTcyMzM4MzQ1OH0.Iq_Zw0Iny58Cadc6pEA4L9_OHogafJZeK_B0sNz2AMk',
  })
  token: string;
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
