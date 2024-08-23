import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
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
