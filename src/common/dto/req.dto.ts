import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';

export class PageReqDto {
  @ApiPropertyOptional({ description: 'default page = 1' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'default size = 20' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  size?: number = 20;
}
