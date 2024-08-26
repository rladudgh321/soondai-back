import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class addpostReqDto {
  @ApiProperty({ required: true, example: '제목' })
  title: string;

  @ApiPropertyOptional({ example: '내용입니다' })
  content?: string;

  @ApiProperty({
    title: 'token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTNkY2I1OS0wNWU2LTRmZmMtODBjMC01MGRhMDIwYzE0ZWIiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MTc4MTAwNTUsImV4cCI6MTcxNzg5NjQ1NX0.vNX8WwING54eSicUgzvmgKBQttMY56INV9KlRskhDQ8',
  })
  token: string;

  @ApiProperty({ title: '글 공개 여부', required: true })
  published: boolean;

  @ApiProperty({ title: '하이라이트 여부', required: true })
  highlight: boolean;

  @ApiPropertyOptional({ title: '메인 이미지' })
  image?: string;

  @ApiProperty({ title: '카테고리', required: true })
  category: string;

  @ApiPropertyOptional({ title: '선택 날짜' })
  select?: Date;
}

export class removePostReqDto {
  @ApiProperty({ required: true, title: 'postId' })
  id: string;

  @ApiProperty({ required: true, title: 'acessToken' })
  data: string;
}

export class UpdatePostReqDto {
  @ApiProperty({ required: true, title: 'postId' })
  params: string;

  @ApiPropertyOptional({
    title: 'update title',
    example: 'update title',
  })
  title: string;

  @ApiPropertyOptional({
    title: 'update content',
    example: 'update content',
  })
  content: string;

  @ApiProperty({ required: true, title: '공개여부' })
  published: boolean;

  @ApiProperty({ required: true, title: '하이라이트 여부' })
  highlight: boolean;

  @ApiPropertyOptional({
    title: '게시글 대표이미지',
  })
  image: string;

  @ApiProperty({ required: true, title: '카테고리' })
  category: string;

  @ApiPropertyOptional({
    title: '날짜 선택',
  })
  select: Date;
}

export class getPostReqDto {
  @ApiProperty({
    required: true,
    title: 'post id',
    example: 'd75aaad6-46a7-4914-925a-f0c4a2adf9c1',
  })
  id: string;

  @ApiProperty({
    required: true,
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTNkY2I1OS0wNWU2LTRmZmMtODBjMC01MGRhMDIwYzE0ZWIiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MTgwOTY1MjQsImV4cCI6MTcxODE4MjkyNH0.5JwCMuXrorjpmH_DUO6tQ_1KDCSY3j_VCwcZneZpPMM',
    description: 'acessToken 만료되면 변경시켜줘야함',
  })
  token: string;
}

export class UploadImageReqDto {
  @ApiProperty({ required: true })
  token: string;

  @ApiProperty({ required: true, type: 'string', format: 'binary' })
  file: string;
}
