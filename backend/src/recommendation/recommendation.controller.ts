import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get('for-you')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get personalized recommendations for user' })
  @ApiQuery({ name: 'excludeRecipeId', required: false, type: String })
  getForYou(
    @Request() req,
    @Query('excludeRecipeId') excludeRecipeId?: string,
  ) {
    return this.recommendationService.getPersonalizedRecommendations(
      req.user.id,
      excludeRecipeId,
    );
  }
}
