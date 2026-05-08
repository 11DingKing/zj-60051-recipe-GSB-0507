import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddToCollectionDto {
  @ApiProperty({ description: "收藏夹ID" })
  @IsString()
  @IsNotEmpty()
  collectionId: string;
}
