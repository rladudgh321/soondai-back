import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { User, UserAfterAuth } from 'src/common/decorator/user.decorator';
import { AuthService } from './auth.service';
import { SignUpReqDto, SigninReqDto } from './dto/req.dto';
import { RefreshTokenResDto, SignUpResDto, SignInResDto } from './dto/res.dto';

@ApiTags('auth')
@ApiExtraModels(SignUpReqDto, SignUpResDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiPostResponse(SignUpResDto)
  @Public()
  @ApiBearerAuth()
  @Post('signup')
  async signup(
    @Body()
    { email, password, passwordConfirm, name }: SignUpReqDto,
  ): Promise<SignUpResDto> {
    if (password !== passwordConfirm)
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다');
    const { id, accessToken, refreshToken } = await this.authService.signup(
      email,
      password,
      name,
    );
    return { id, accessToken, refreshToken };
  }

  @ApiPostResponse(SignInResDto)
  @Public()
  @Post('signin')
  async signin(@Body() { email, password }: SigninReqDto): Promise<SignInResDto> {
    return this.authService.signin(email, password);
  }

  @ApiPostResponse(RefreshTokenResDto)
  @ApiBearerAuth()
  @Post('refresh')
  async refresh(
    @Headers('authorization') authorization,
    @User() user: UserAfterAuth,
  ) {
    const token = /Bearer\s(.+)/.exec(authorization)[1];
    const { id, accessToken, refreshToken } = await this.authService.refresh(
      user.id,
      token,
    );
    return { id, accessToken, refreshToken };
  }

  @Public()
  @ApiBearerAuth()
  @Post('isLoggedIn')
  isLoggedIn(@User() user): boolean {
    return !!user?.sub || false;
  }
}
