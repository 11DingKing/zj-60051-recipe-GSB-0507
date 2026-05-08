import { Module } from "@nestjs/common";
import { RecipeService } from "./recipe.service";
import { RecipeController } from "./recipe.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";
import { CollectionsModule } from "../collections/collections.module";

@Module({
  imports: [PrismaModule, RedisModule, CollectionsModule],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService],
})
export class RecipeModule {}
