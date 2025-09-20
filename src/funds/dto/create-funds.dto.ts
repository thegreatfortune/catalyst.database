import { IsNotEmpty, IsString } from 'class-validator'

export class CreateFundsDto {
    @IsNotEmpty()
    @IsString()
    userId: string
}
