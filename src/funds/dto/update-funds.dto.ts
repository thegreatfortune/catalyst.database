import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { OperationType } from "../../schemas/transaction.schema"

export class UpdateFundsDto {
    @IsNotEmpty()
    @IsString()
    userId: string

    @IsNotEmpty()
    @IsEnum(OperationType)
    operationType: OperationType

    // @IsOptional()
    // @IsString()
    // reason?: string

    // @IsOptional()
    // balanceAfter?: number

    // @IsOptional()
    // relatedEntities?: RelatedEntity[]

    // @IsOptional()
    // @IsString()
    // transactionHash?: string
}
