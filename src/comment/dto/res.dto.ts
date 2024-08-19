import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class addCommentResDto {
  @ApiPropertyOptional({ title: '유저 프로필 사진' })
  profile?: string;

  @ApiProperty({ title: '유저 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ title: '생성일', example: new Date('2024-01-01') })
  createdAt: Date;

  @ApiProperty({ title: '댓글', example: '댓글입니다' })
  content: string;
}

export class getCommentResDto {
  @ApiPropertyOptional({ title: '유저 프로필 사진' })
  profile?: string;

  @ApiProperty({ title: '유저 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ title: '생성일', example: new Date('2024-01-01') })
  createdAt: Date;

  @ApiProperty({ title: '댓글', example: '댓글입니다' })
  content: string;

  @ApiProperty({ title: '댓글 유저아이디', example: '댓글유저입니다' })
  userId: string;
}

export class removeCommentResDto {
  @ApiProperty({ title: '포스트 아이디' })
  postId: string;

  @ApiProperty({ title: '댓글 아이디' })
  commentId: string;
}

export class removeCommentsResDto {
  @ApiProperty({
    required: true,
  })
  count: number;
}

export class addLikeCommentResDto {
  @ApiProperty({ required: true })
  heartOrNot: string;

  @ApiProperty({ required: true })
  count: number;
}

export class getLikeCommentResDto {
  @ApiProperty({ required: true })
  heartOrNot: string;

  @ApiProperty({ required: true })
  count: number;
}
