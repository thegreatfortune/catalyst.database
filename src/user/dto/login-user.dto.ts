import { Type } from "class-transformer"
import { IsDate, IsEthereumAddress, IsNotEmpty, IsNumber, IsString } from "class-validator"

export class LoginUserDto {
    @IsNotEmpty()
    @IsString()
    @IsEthereumAddress()
    walletAddress: string

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    chainId: number


    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    issuedAt: Date
}