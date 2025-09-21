import { IsMongoId, IsNotEmpty, IsString } from "class-validator"

export class UploadMediaCreditAndFundsDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsNotEmpty()
    @IsString()
    mediaId: string
}