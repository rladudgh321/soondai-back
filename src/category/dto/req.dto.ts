import { ApiProperty } from '@nestjs/swagger';

export class addCategoryReqDto {
  @ApiProperty({ required: true })
  name: string;
}
