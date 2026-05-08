import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { RecipeStatus } from '@prisma/client';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async ensureDefaultCollection(userId: string) {
    const existing = await this.prisma.collection.findFirst({
      where: { userId, isDefault: true },
    });
    if (!existing) {
      await this.prisma.collection.create({
        data: {
          name: '默认收藏夹',
          userId,
          isDefault: true,
        },
      });
    }
  }

  async findAll(userId: string) {
    await this.ensureDefaultCollection(userId);
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return collections.map((col) => ({
      ...col,
      recipeCount: col._count.items,
      _count: undefined,
    }));
  }

  async findOne(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this collection');
    }

    return {
      ...collection,
      recipeCount: collection._count.items,
      _count: undefined,
    };
  }

  async create(userId: string, createCollectionDto: CreateCollectionDto) {
    const existing = await this.prisma.collection.findUnique({
      where: { userId_name: { userId, name: createCollectionDto.name } },
    });

    if (existing) {
      throw new ConflictException('Collection name already exists');
    }

    return this.prisma.collection.create({
      data: {
        ...createCollectionDto,
        userId,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    updateCollectionDto: UpdateCollectionDto,
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this collection');
    }

    if (collection.isDefault) {
      throw new BadRequestException('Cannot rename default collection');
    }

    if (updateCollectionDto.name && updateCollectionDto.name !== collection.name) {
      const existing = await this.prisma.collection.findUnique({
        where: { userId_name: { userId, name: updateCollectionDto.name } },
      });
      if (existing) {
        throw new ConflictException('Collection name already exists');
      }
    }

    return this.prisma.collection.update({
      where: { id },
      data: updateCollectionDto,
    });
  }

  async remove(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this collection');
    }

    if (collection.isDefault) {
      throw new BadRequestException('Cannot delete default collection');
    }

    await this.ensureDefaultCollection(userId);
    const defaultCollection = await this.prisma.collection.findFirst({
      where: { userId, isDefault: true },
    });

    if (!defaultCollection) {
      throw new NotFoundException('Default collection not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const itemsToMove = await tx.collectionItem.findMany({
        where: { collectionId: id },
        select: { recipeId: true },
      });

      for (const item of itemsToMove) {
        const existing = await tx.collectionItem.findUnique({
          where: {
            collectionId_recipeId: {
              collectionId: defaultCollection.id,
              recipeId: item.recipeId,
            },
          },
        });
        if (!existing) {
          await tx.collectionItem.create({
            data: {
              collectionId: defaultCollection.id,
              recipeId: item.recipeId,
            },
          });
        }
      }

      await tx.collectionItem.deleteMany({
        where: { collectionId: id },
      });

      await tx.collection.delete({
        where: { id },
      });
    });

    return { message: 'Collection deleted successfully' };
  }

  async getRecipes(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this collection');
    }

    const items = await this.prisma.collectionItem.findMany({
      where: { collectionId },
      orderBy: { createdAt: 'desc' },
      include: {
        recipe: {
          include: {
            author: {
              select: { id: true, username: true, nickname: true, avatar: true },
            },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    return items.map((item) => item.recipe);
  }

  async addRecipe(userId: string, collectionId: string, recipeId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not authorized to modify this collection');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe || recipe.status !== RecipeStatus.PUBLISHED) {
      throw new NotFoundException('Recipe not found');
    }

    const existing = await this.prisma.collectionItem.findUnique({
      where: { collectionId_recipeId: { collectionId, recipeId } },
    });

    if (existing) {
      throw new ConflictException('Recipe already in collection');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.collectionItem.create({
        data: { collectionId, recipeId },
      });

      const count = await tx.collectionItem.count({
        where: { recipeId },
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: { favoriteCount: count },
      });
    });

    return { added: true };
  }

  async removeRecipe(userId: string, collectionId: string, recipeId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not authorized to modify this collection');
    }

    const existing = await this.prisma.collectionItem.findUnique({
      where: { collectionId_recipeId: { collectionId, recipeId } },
    });

    if (!existing) {
      throw new NotFoundException('Recipe not in this collection');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.collectionItem.delete({
        where: { collectionId_recipeId: { collectionId, recipeId } },
      });

      const count = await tx.collectionItem.count({
        where: { recipeId },
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: { favoriteCount: count },
      });
    });

    return { removed: true };
  }

  async getRecipeCollections(userId: string, recipeId: string) {
    const items = await this.prisma.collectionItem.findMany({
      where: { recipeId },
      include: {
        collection: true,
      },
    });

    return items
      .filter((item) => item.collection.userId === userId)
      .map((item) => item.collection);
  }

  async toggleFavoriteWithCollection(
    recipeId: string,
    userId: string,
    collectionId?: string,
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe || recipe.status !== RecipeStatus.PUBLISHED) {
      throw new NotFoundException('Recipe not found');
    }

    await this.ensureDefaultCollection(userId);

    const targetCollectionId =
      collectionId ||
      (
        await this.prisma.collection.findFirst({
          where: { userId, isDefault: true },
        })
      )?.id;

    if (!targetCollectionId) {
      throw new NotFoundException('Default collection not found');
    }

    const existingInTarget = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_recipeId: {
          collectionId: targetCollectionId,
          recipeId,
        },
      },
    });

    if (existingInTarget) {
      await this.prisma.$transaction(async (tx) => {
        await tx.collectionItem.delete({
          where: {
            collectionId_recipeId: {
              collectionId: targetCollectionId,
              recipeId,
            },
          },
        });

        const totalCount = await tx.collectionItem.count({
          where: { recipeId },
        });

        await tx.recipe.update({
          where: { id: recipeId },
          data: { favoriteCount: totalCount },
        });
      });

      return { isFavorited: false };
    } else {
      await this.prisma.$transaction(async (tx) => {
        await tx.collectionItem.create({
          data: {
            collectionId: targetCollectionId,
            recipeId,
          },
        });

        const totalCount = await tx.collectionItem.count({
          where: { recipeId },
        });

        await tx.recipe.update({
          where: { id: recipeId },
          data: { favoriteCount: totalCount },
        });
      });

      return { isFavorited: true, collectionId: targetCollectionId };
    }
  }
}
