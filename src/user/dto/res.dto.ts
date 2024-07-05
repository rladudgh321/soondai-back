import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsUUID } from 'class-validator';

export class FindUserResDto {
  @ApiProperty({ required: true })
  @IsUUID()
  id: string;

  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsDate()
  createdAt: string;
}
