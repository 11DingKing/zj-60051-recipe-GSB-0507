import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCollectionDto {
  @ApiProperty({ description: "收藏夹名称" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;
}
