import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiParam, ApiTags } from '@nestjs/swagger';
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

  @Public()
  @Get('/')
  async getCategories() {
    const category = await this.categoryService.getCategories();
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

    // 태그 수정
    @ApiBearerAuth()
    @ApiParam({
      name: "id",
      description: "The ID of the tag to update",
      example: 1,
    }) // Swagger에서 파라미터 id에 대한 설명 추가
    // @ApiPostResponse(UpdateTagResDto)
    @Patch(":id")
    async updateTag(
      @Param("id") id: string,
      @Body() { name }: any,
      @Headers("authorization") token: string,
    ): Promise<any> {
      const updatedTag = await this.categoryService.updateCategories(id, name, token);
      return { id, name: updatedTag.name };
    }
}
