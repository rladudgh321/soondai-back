import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import {
  ApiPostResponse
} from 'src/common/decorator/swagger.decorator';
import { CategoryService } from './category.service';
import { addCategoryReqDto } from './dto/req.dto';
import { addCategoryResDto } from './dto/res.dto';

@ApiTags('category')
@ApiExtraModels()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiPostResponse(addCategoryResDto)
  @ApiBearerAuth()
  @Post('/')
  async addCategory(
    @Headers('authorization') token: string,
    @Body() { name }: addCategoryReqDto,
  ): Promise<addCategoryResDto> {
    const category = await this.categoryService.addCategory(token, name);
    return { name: category.name };
  }

  // Nav에서 CategoryId를 보내면 카테고리 이름을 보내도록하기
  @ApiBearerAuth()
  @Public()
  @Get('/nav/:categoryId')
  async getCategory(@Param('categoryId') categoryId: string) {
    const category = await this.categoryService.getCategory(categoryId);
    return category;
  }

  @ApiBearerAuth()
  @Get('/')
  async getCategories(@Headers('authorization') token: string) {
    const category = await this.categoryService.getCategories(token);
    return category;
  }


  @ApiBearerAuth()
  @Delete(':categoryId')
  async removeCategory(
    @Headers('authorization') token: string,
    @Param('categoryId') categoryId: string,
  ): Promise<any> {
    const category = await this.categoryService.removeCategory(
      token,
      categoryId,
    );
    return category;
  }
}
