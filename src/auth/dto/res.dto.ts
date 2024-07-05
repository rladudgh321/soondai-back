import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SignUpResDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  accessToken: string;

  @ApiProperty({ required: true })
  refreshToken: string;
}

export class SignInResDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  accessToken: string;

  @ApiProperty({ required: true })
  refreshToken: string;
}

export class RefreshTokenResDto {
  @ApiProperty({ required: true })
  @IsUUID()
  id: string;

  @ApiProperty({ required: true })
  accessToken: string;

  @ApiProperty({ required: true })
  refreshToken: string;
}
