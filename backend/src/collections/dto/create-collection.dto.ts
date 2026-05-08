import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;
}
