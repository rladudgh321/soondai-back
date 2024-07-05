import { ApiProperty } from '@nestjs/swagger';

export class PageResDto<TData> {
  @ApiProperty({ required: true })
  page: number;

  @ApiProperty({ required: true })
  size: number;

  @ApiProperty({ required: true })
  items: TData[];
}
