import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { RecipeStatus, Role } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { recipeId, parentId } = createCommentDto;

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe || recipe.status !== RecipeStatus.PUBLISHED) {
      throw new NotFoundException('Recipe not found');
    }

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.parentId) {
        throw new ForbiddenException('Cannot reply to a reply');
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          ...createCommentDto,
          userId,
        },
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, username: true, nickname: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    return comment;
  }

  async findByRecipe(recipeId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          recipeId,
          parentId: null,
          isHidden: false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          replies: {
            where: { isHidden: false },
            include: {
              user: {
                select: { id: true, username: true, nickname: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.comment.count({
        where: { recipeId, parentId: null, isHidden: false },
      }),
    ]);

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMyComments(userId: string) {
    return this.prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        recipe: {
          select: { id: true, title: true, coverImage: true },
        },
      },
    });
  }

  async report(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { isReported: true },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({
        where: { parentId: id },
      });

      await tx.comment.delete({
        where: { id },
      });

      await tx.recipe.update({
        where: { id: comment.recipeId },
        data: { commentCount: { decrement: 1 } },
      });
    });

    return { message: 'Comment deleted successfully' };
  }

  async findReported(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { isReported: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          recipe: {
            select: { id: true, title: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { isReported: true },
      }),
    ]);

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async handleReport(id: string, action: 'hide' | 'dismiss') {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (action === 'hide') {
      return this.prisma.comment.update({
        where: { id },
        data: { isHidden: true, isReported: false },
      });
    } else {
      return this.prisma.comment.update({
        where: { id },
        data: { isReported: false },
      });
    }
  }
}
