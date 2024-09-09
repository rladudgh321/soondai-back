import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class addpostResDto {
  @ApiProperty({ required: true, example: '유저아이디' })
  id: string;

  @ApiProperty({ required: true, example: '제목' })
  title: string;

  @ApiPropertyOptional({ example: '내용입니다' })
  content?: string;

  @ApiProperty({ required: true, example: 'postId' })
  postId: string;
}

export class RemovePostResDto {
  @ApiProperty({ required: true, title: 'deleted UUID' })
  @IsUUID()
  id: string;
}

export class UpdatePostResDto {
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

  @ApiProperty({
    required: true,
    title: 'postId',
    example: 'd75aaad6-46a7-4914-925a-f0c4a2adf9c1',
  })
  id: string;
}

export class GetPostReqDto {
  @ApiProperty({ required: true, title: 'postId' })
  id: string;

  @ApiProperty({ required: true })
  title: string;

  @ApiProperty({ required: true })
  content: string;
}

export class UploadImageResDto {
  @ApiProperty({ required: true })
  name: string;
}
