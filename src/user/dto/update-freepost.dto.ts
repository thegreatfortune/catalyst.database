import { Type } from "class-transformer"
import { IsDate, IsMongoId, IsNotEmpty } from "class-validator"

export class UpdateFreePostDto {

    @IsMongoId()
    @IsNotEmpty()
    userId: string
 
    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    expiryTime: Date
}