import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  async ensureDefaultCollection(userId: string) {
    const existing = await this.prisma.collection.findFirst({
      where: { userId, isDefault: true },
    });
    if (existing) return existing;

    return this.prisma.collection.create({
      data: { name: "默认收藏夹", isDefault: true, userId },
    });
  }

  async findAll(userId: string) {
    await this.ensureDefaultCollection(userId);

    return this.prisma.collection.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { items: true } } },
    });
  }

  async findOne(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException("收藏夹不存在");
    if (collection.userId !== userId)
      throw new ForbiddenException("无权访问该收藏夹");
    return collection;
  }

  async create(userId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: { name: dto.name, userId },
    });
  }

  async update(userId: string, collectionId: string, dto: UpdateCollectionDto) {
    const collection = await this.findOne(userId, collectionId);
    if (collection.isDefault) {
      throw new BadRequestException("默认收藏夹不能改名");
    }
    return this.prisma.collection.update({
      where: { id: collectionId },
      data: { name: dto.name },
    });
  }

  async remove(userId: string, collectionId: string) {
    const collection = await this.findOne(userId, collectionId);
    if (collection.isDefault) {
      throw new BadRequestException("默认收藏夹不能删除");
    }

    const defaultCollection = await this.ensureDefaultCollection(userId);

    await this.prisma.$transaction(async (tx) => {
      const items = await tx.collectionItem.findMany({
        where: { collectionId },
        select: { recipeId: true },
      });

      for (const item of items) {
        const existsInDefault = await tx.collectionItem.findUnique({
          where: {
            collectionId_recipeId: {
              collectionId: defaultCollection.id,
              recipeId: item.recipeId,
            },
          },
        });
        if (!existsInDefault) {
          await tx.collectionItem.create({
            data: {
              collectionId: defaultCollection.id,
              recipeId: item.recipeId,
            },
          });
        }
      }

      await tx.collection.delete({ where: { id: collectionId } });
    });

    return { message: "收藏夹已删除，菜谱已移至默认收藏夹" };
  }

  async getItems(userId: string, collectionId: string) {
    await this.findOne(userId, collectionId);

    const items = await this.prisma.collectionItem.findMany({
      where: { collectionId },
      orderBy: { createdAt: "desc" },
      include: {
        recipe: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
              },
            },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    return items.map((item) => item.recipe);
  }

  async addRecipe(userId: string, recipeId: string, collectionId: string) {
    await this.findOne(userId, collectionId);

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (!recipe) throw new NotFoundException("菜谱不存在");

    const existing = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_recipeId: { collectionId, recipeId },
      },
    });
    if (existing) {
      return { message: "该菜谱已在收藏夹中" };
    }

    await this.prisma.$transaction([
      this.prisma.collectionItem.create({
        data: { collectionId, recipeId },
      }),
      this.prisma.recipe.update({
        where: { id: recipeId },
        data: { favoriteCount: { increment: 1 } },
      }),
    ]);

    return { isFavorited: true, collectionId };
  }

  async removeRecipe(userId: string, recipeId: string, collectionId: string) {
    await this.findOne(userId, collectionId);

    const existing = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_recipeId: { collectionId, recipeId },
      },
    });
    if (!existing) throw new NotFoundException("该菜谱不在此收藏夹中");

    await this.prisma.$transaction([
      this.prisma.collectionItem.delete({
        where: {
          collectionId_recipeId: { collectionId, recipeId },
        },
      }),
      this.prisma.recipe.update({
        where: { id: recipeId },
        data: { favoriteCount: { decrement: 1 } },
      }),
    ]);

    const stillInOtherCollection = await this.prisma.collectionItem.findFirst({
      where: { recipeId, collection: { userId } },
    });

    return { isFavorited: !!stillInOtherCollection, collectionId };
  }

  async isRecipeInAnyCollection(userId: string, recipeId: string) {
    const item = await this.prisma.collectionItem.findFirst({
      where: { recipeId, collection: { userId } },
      include: { collection: { select: { id: true, name: true } } },
    });
    if (!item)
      return { isFavorited: false, collectionId: null, collectionName: null };
    return {
      isFavorited: true,
      collectionId: item.collection.id,
      collectionName: item.collection.name,
    };
  }
}
