import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CollectionService } from "./collection.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";
import { AddToCollectionDto } from "./dto/add-to-collection.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("collections")
@Controller("collections")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  @ApiOperation({ summary: "获取我的所有收藏夹" })
  findAll(@Request() req) {
    return this.collectionService.findAll(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取收藏夹详情" })
  findOne(@Request() req, @Param("id") id: string) {
    return this.collectionService.findOne(req.user.id, id);
  }

  @Get(":id/recipes")
  @ApiOperation({ summary: "获取收藏夹中的菜谱" })
  getItems(@Request() req, @Param("id") id: string) {
    return this.collectionService.getItems(req.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: "创建收藏夹" })
  create(@Request() req, @Body() dto: CreateCollectionDto) {
    return this.collectionService.create(req.user.id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "重命名收藏夹" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionService.update(req.user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除收藏夹(菜谱移至默认)" })
  remove(@Request() req, @Param("id") id: string) {
    return this.collectionService.remove(req.user.id, id);
  }

  @Post("recipes/:recipeId")
  @ApiOperation({ summary: "将菜谱添加到收藏夹" })
  addRecipe(
    @Request() req,
    @Param("recipeId") recipeId: string,
    @Body() dto: AddToCollectionDto,
  ) {
    return this.collectionService.addRecipe(
      req.user.id,
      recipeId,
      dto.collectionId,
    );
  }

  @Delete("recipes/:recipeId/:collectionId")
  @ApiOperation({ summary: "从收藏夹移除菜谱" })
  removeRecipe(
    @Request() req,
    @Param("recipeId") recipeId: string,
    @Param("collectionId") collectionId: string,
  ) {
    return this.collectionService.removeRecipe(
      req.user.id,
      recipeId,
      collectionId,
    );
  }
}
