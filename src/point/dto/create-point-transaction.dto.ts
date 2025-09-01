import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { RelatedEntityType, TransactionType } from "../../schemas/point.schema"
import { Type } from "class-transformer"

export class UpdatePointDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    userId: string

    @IsNotEmpty()
    @IsString()
    @IsEnum(TransactionType)
    transactionType: TransactionType

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    balanceAfter?: number

    @IsOptional()
    @IsString()
    reason?: string

    @IsOptional()
    @IsString()
    resourceTraded?: string

    @IsOptional()
    @Type(() => RelatedEntityDto)
    relatedEntities?: Array<RelatedEntityDto>
}

export class RelatedEntityDto {
    @IsNotEmpty()
    @IsEnum(RelatedEntityType)
    type: RelatedEntityType

    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    relatedId: string
}