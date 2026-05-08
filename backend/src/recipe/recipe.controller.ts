import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { RecipeService } from "./recipe.service";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { UpdateRecipeDto } from "./dto/update-recipe.dto";
import { SearchRecipeDto } from "./dto/search-recipe.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RecipeStatus } from "@prisma/client";
import { CollectionsService } from "../collections/collections.service";

@ApiTags("recipes")
@Controller("recipes")
export class RecipeController {
  constructor(
    private readonly recipeService: RecipeService,
    private readonly collectionsService: CollectionsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create a new recipe" })
  create(@Body() createRecipeDto: CreateRecipeDto, @Request() req) {
    return this.recipeService.create(req.user.id, createRecipeDto);
  }

  @Get("hot")
  @ApiOperation({ summary: "Get hot recipes (by like count)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  findHot(@Query("limit") limit?: number) {
    return this.recipeService.findHot(limit || 8);
  }

  @Get("latest")
  @ApiOperation({ summary: "Get latest recipes with search/filter" })
  findLatest(@Query() searchDto: SearchRecipeDto) {
    return this.recipeService.findLatest(searchDto);
  }

  @Get("my")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get my recipes" })
  @ApiQuery({ name: "status", required: false, enum: RecipeStatus })
  findMyRecipes(@Request() req, @Query("status") status?: RecipeStatus) {
    return this.recipeService.findMyRecipes(req.user.id, status);
  }

  @Get("favorites")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get my favorite recipes (all collections combined)",
  })
  findMyFavorites(@Request() req) {
    return this.recipeService.findMyFavorites(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get recipe by id" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.recipeService.findOne(id, req.user?.id);
  }

  @Get(":id/related")
  @ApiOperation({ summary: "Get related recipes (same category)" })
  findRelated(
    @Param("id") id: string,
    @Query("categoryId") categoryId: string,
    @Query("limit") limit?: number,
  ) {
    return this.recipeService.findRelated(categoryId, id, limit || 6);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update a recipe" })
  update(
    @Param("id") id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Request() req,
  ) {
    return this.recipeService.update(id, req.user.id, updateRecipeDto);
  }

  @Post(":id/like")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Toggle like on recipe" })
  toggleLike(@Param("id") id: string, @Request() req) {
    return this.recipeService.toggleLike(id, req.user.id);
  }

  @Post(":id/favorite")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Toggle favorite on recipe (with optional collectionId)",
  })
  toggleFavorite(
    @Param("id") id: string,
    @Body() body: { collectionId?: string },
    @Request() req,
  ) {
    return this.recipeService.toggleFavorite(
      id,
      req.user.id,
      body?.collectionId,
    );
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Delete a recipe" })
  remove(@Param("id") id: string, @Request() req) {
    return this.recipeService.remove(id, req.user.id, req.user.role);
  }
}
