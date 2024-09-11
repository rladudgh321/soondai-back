import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsUUID } from 'class-validator';
import { Role } from '../enum/role.enum';

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

export class GetUserIdResDto {
  @ApiProperty({ required: true })
  @IsUUID()
  id: string;

  @ApiProperty({ type: 'enum', required: true, enum: Role })
  role: string;
}
