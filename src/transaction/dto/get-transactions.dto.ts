import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { OperationType } from '../../schemas/transaction.schema'

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export class GetTransactionsDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsOptional()
    @IsString()
    @IsEnum(OperationType)
    operationType?: OperationType

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit: number

    @IsNotEmpty()
    @IsEnum(SortOrder)
    sortOrder: SortOrder
}
