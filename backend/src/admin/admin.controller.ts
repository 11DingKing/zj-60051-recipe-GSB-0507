import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('recipes-by-category')
  @ApiOperation({ summary: 'Get recipe count by category (Admin only)' })
  getRecipesByCategory() {
    return this.adminService.getRecipesByCategory();
  }

  @Get('recipes-last-30-days')
  @ApiOperation({ summary: 'Get new recipes trend for last 30 days (Admin only)' })
  getRecipesLast30Days() {
    return this.adminService.getRecipesLast30Days();
  }

  @Get('top-recipes')
  @ApiOperation({ summary: 'Get top recipes by likes (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopRecipes(@Query('limit') limit?: number) {
    return this.adminService.getTopRecipes(limit || 10);
  }

  @Get('user-activity')
  @ApiOperation({ summary: 'Get user activity for last 7 days (Admin only)' })
  getUserActivityLast7Days() {
    return this.adminService.getUserActivityLast7Days();
  }
}
