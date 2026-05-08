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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all my collections' })
  findAll(@Request() req) {
    return this.collectionsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get collection by id' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.collectionsService.findOne(req.user.id, id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new collection' })
  create(@Body() createCollectionDto: CreateCollectionDto, @Request() req) {
    return this.collectionsService.create(req.user.id, createCollectionDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update collection name' })
  update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @Request() req,
  ) {
    return this.collectionsService.update(
      req.user.id,
      id,
      updateCollectionDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a collection (moves recipes to default)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.collectionsService.remove(req.user.id, id);
  }

  @Get(':id/recipes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get recipes in a collection' })
  getRecipes(@Param('id') id: string, @Request() req) {
    return this.collectionsService.getRecipes(req.user.id, id);
  }

  @Post('add-recipe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add recipe to collection' })
  addRecipe(
    @Body() body: { collectionId: string; recipeId: string },
    @Request() req,
  ) {
    return this.collectionsService.addRecipe(
      req.user.id,
      body.collectionId,
      body.recipeId,
    );
  }

  @Post('remove-recipe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove recipe from collection' })
  removeRecipe(
    @Body() body: { collectionId: string; recipeId: string },
    @Request() req,
  ) {
    return this.collectionsService.removeRecipe(
      req.user.id,
      body.collectionId,
      body.recipeId,
    );
  }

  @Get('recipe/:recipeId/collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get collections that contain a recipe' })
  getRecipeCollections(@Param('recipeId') recipeId: string, @Request() req) {
    return this.collectionsService.getRecipeCollections(req.user.id, recipeId);
  }
}
