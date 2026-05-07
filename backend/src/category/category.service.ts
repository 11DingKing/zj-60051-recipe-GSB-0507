import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  private readonly CACHE_KEY = 'categories';
  private readonly CACHE_TTL = 3600;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException('Category already exists');
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    await this.clearCache();
    return category;
  }

  async findAll() {
    const cached = await this.redisService.get(this.CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { recipes: { where: { status: 'PUBLISHED' } } },
        },
      },
    });

    const result = categories.map((cat) => ({
      ...cat,
      recipeCount: cat._count.recipes,
      _count: undefined,
    }));

    await this.redisService.set(
      this.CACHE_KEY,
      JSON.stringify(result),
      this.CACHE_TTL,
    );

    return result;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { recipes: { where: { status: 'PUBLISHED' } } },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      recipeCount: category._count.recipes,
      _count: undefined,
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
      });
      if (existing) {
        throw new ConflictException('Category name already exists');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    await this.clearCache();
    return updated;
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { recipes: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.recipes.length > 0) {
      throw new ConflictException('Cannot delete category with recipes');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    await this.clearCache();
    return { message: 'Category deleted successfully' };
  }

  private async clearCache() {
    await this.redisService.del(this.CACHE_KEY);
  }
}
