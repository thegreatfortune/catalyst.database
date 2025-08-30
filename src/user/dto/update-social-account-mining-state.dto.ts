
import { IsNotEmpty, IsNumber, Min } from 'class-validator'

export class UpdateSocialAccountMiningStateDto {
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    points: number

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    count: number
}