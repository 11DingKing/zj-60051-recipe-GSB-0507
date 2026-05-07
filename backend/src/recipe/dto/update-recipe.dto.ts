import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, RecipeStatus } from '@prisma/client';

class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class UpdateStepDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsInt()
  stepNumber?: number;
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cookTime?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @IsOptional()
  @IsEnum(RecipeStatus)
  status?: RecipeStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateIngredientDto)
  ingredients?: UpdateIngredientDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStepDto)
  steps?: UpdateStepDto[];
}
