import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { RelatedEntityType, CreditTransactionType } from "../../schemas/credit.schema"
import { Type } from "class-transformer"
import { OperationType } from "../../schemas/transaction.schema"


export class UpdateCreditDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsNotEmpty()
    @IsString()
    @IsEnum(OperationType)
    operationType: OperationType

    // @IsOptional()
    // @IsNumber()
    // @Type(() => Number)
    // balanceAfter?: number

    // @IsOptional()
    // @IsString()
    // reason?: string

    // @IsOptional()
    // @IsString()
    // resourceTraded?: string

    // @IsOptional()
    // @Type(() => RelatedEntityDto)
    // relatedEntities?: Array<RelatedEntityDto>
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