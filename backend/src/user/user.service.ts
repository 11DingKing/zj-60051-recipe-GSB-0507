import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          avatar: true,
          role: true,
          createdAt: true,
          _count: {
            select: { recipes: true, comments: true, favorites: true },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => ({
        ...u,
        recipeCount: u._count.recipes,
        commentCount: u._count.comments,
        favoriteCount: u._count.favorites,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: { recipes: true, comments: true, favorites: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      recipeCount: user._count.recipes,
      commentCount: user._count.comments,
      favoriteCount: user._count.favorites,
      _count: undefined,
    };
  }
}
