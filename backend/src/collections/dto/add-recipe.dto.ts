import { IsNotEmpty, IsString } from 'class-validator';

export class AddRecipeDto {
  @IsNotEmpty()
  @IsString()
  collectionId: string;

  @IsNotEmpty()
  @IsString()
  recipeId: string;
}
