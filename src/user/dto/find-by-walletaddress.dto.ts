import { Type } from "class-transformer"
import { IsEthereumAddress, IsNotEmpty, IsNumber, IsString } from "class-validator"

export class FindByWalletAddressDto {
    @IsNotEmpty()
    @IsString()
    @IsEthereumAddress()
    walletAddress: string

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    chainId: number
}