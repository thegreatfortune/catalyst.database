import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { OperationType, RelatedEntityType } from "../../schemas/transaction.schema"

export class CreateTransactionDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsNotEmpty()
    @IsString()
    @IsEnum(OperationType)
    operationType: OperationType

    @IsOptional()
    @IsNumber()
    creditBalanceAfter?: number

    @IsOptional()
    @IsNumber()
    fundsBalanceAfter?: number

    @IsOptional()
    @IsString()
    reason?: string

    @IsOptional()
    @IsString()
    transactionHash?: string

    // @IsOptional()
    // @IsString()
    // status?: string

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
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