import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { CategoryModule } from "./category/category.module";
import { RecipeModule } from "./recipe/recipe.module";
import { CommentModule } from "./comment/comment.module";
import { AdminModule } from "./admin/admin.module";
import { CollectionsModule } from "./collections/collections.module";
import { RecommendationModule } from "./recommendation/recommendation.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
    CategoryModule,
    CollectionsModule,
    RecipeModule,
    CommentModule,
    RecommendationModule,
    AdminModule,
  ],
})
export class AppModule {}
