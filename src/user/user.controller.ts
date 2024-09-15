import {
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import {
  ApiGetItemsResponse,
  ApiGetResponse,
} from 'src/common/decorator/swagger.decorator';
import { User, UserAfterAuth } from 'src/common/decorator/user.decorator';
import { PageReqDto } from 'src/common/dto/req.dto';
import { PageResDto } from 'src/common/dto/res.dto';
import { FindUserReqDto } from './dto/req.dto';
import { FindUserResDto, GetUserIdResDto } from './dto/res.dto';
import { Role } from './enum/role.enum';
import { UserService } from './user.service';
@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiExtraModels(PageResDto, FindUserResDto)
  @ApiGetItemsResponse(FindUserResDto)
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Get()
  async findAll(
    @Query() { page, size }: PageReqDto,
    @User() user: UserAfterAuth,
    @Req() req,
  ): Promise<FindUserResDto[]> {
    const users = await this.userService.findAll(page, size);
    console.log('userId', user);
    console.log('req', req.user);
    Logger.log(`Controller - User: ${JSON.stringify(user)}`);
    return users.map(({ id, email, createdAt }) => {
      return { id, email, createdAt: createdAt.toISOString() };
    });
  }

  @ApiGetResponse(GetUserIdResDto)
  @ApiBearerAuth()
  @Get('/findOne')
  async getUserId(
    @Headers('authorization') token: string,
  ): Promise<GetUserIdResDto | null> {
    if (!token) {
      return null;
    }
    const user = await this.userService.getUserId(token);
    return { id: user.id, role: user.role };
  }

  @ApiGetResponse(FindUserResDto)
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@Param() { id }: FindUserReqDto): Promise<FindUserResDto> {
    const { email, createdAt } = await this.userService.findOne(id);
    return { id, email, createdAt: createdAt.toISOString() };
  }
}
