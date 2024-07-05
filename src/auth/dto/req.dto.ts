import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SignUpReqDto {
  @ApiProperty({ example: '111@gmail.com', required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true, example: '111' })
  password: string;

  @ApiProperty({ required: true, example: '111' })
  passwordConfirm: string;

  @ApiPropertyOptional({ example: '홍길동' })
  @IsString()
  name?: string;

}

export class SigninReqDto {
  @ApiProperty({ required: true, example: '111@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true, example: '111' })
  password: string;
}
