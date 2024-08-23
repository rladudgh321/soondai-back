import { ApiProperty } from '@nestjs/swagger';

export class addCategoryResDto {
  @ApiProperty({ required: true })
  name: string;
}
