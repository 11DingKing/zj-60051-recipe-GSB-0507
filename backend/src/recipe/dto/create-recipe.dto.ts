import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, RecipeStatus } from '@prisma/client';

class CreateIngredientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class CreateStepDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNotEmpty()
  @IsInt()
  stepNumber: number;
}

export class CreateRecipeDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cookTime: number;

  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  servings: number;

  @IsOptional()
  @IsEnum(RecipeStatus)
  status?: RecipeStatus;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients: CreateIngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps: CreateStepDto[];
}
