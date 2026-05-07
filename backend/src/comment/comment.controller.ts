import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new comment' })
  create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentService.create(req.user.id, createCommentDto);
  }

  @Get('recipe/:recipeId')
  @ApiOperation({ summary: 'Get comments for a recipe' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByRecipe(
    @Param('recipeId') recipeId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commentService.findByRecipe(recipeId, page || 1, limit || 10);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my comments' })
  findMyComments(@Request() req) {
    return this.commentService.findMyComments(req.user.id);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a comment' })
  report(@Param('id') id: string) {
    return this.commentService.report(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  remove(@Param('id') id: string, @Request() req) {
    return this.commentService.remove(id, req.user.id, req.user.role);
  }

  @Get('reported')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get reported comments (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findReported(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.commentService.findReported(page || 1, limit || 20);
  }

  @Patch(':id/handle-report')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Handle a reported comment (Admin only)' })
  @ApiQuery({ name: 'action', required: true, enum: ['hide', 'dismiss'] })
  handleReport(
    @Param('id') id: string,
    @Query('action') action: 'hide' | 'dismiss',
  ) {
    return this.commentService.handleReport(id, action);
  }
}
