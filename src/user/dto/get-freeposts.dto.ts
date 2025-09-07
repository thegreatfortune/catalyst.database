import { IsNotEmpty, IsString } from "class-validator"

export class GetFreePostsDto {
    @IsString()
    @IsNotEmpty()
    userId: string
}
