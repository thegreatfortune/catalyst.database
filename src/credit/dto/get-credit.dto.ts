import { IsMongoId, IsNotEmpty } from "class-validator"


export class GetCreditDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string
}
