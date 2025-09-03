import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"
import { XPublicMetrics, XUser, XVerifiedType } from "src/schemas/social.schema"

export class XPublicMetricsDto {
    @IsNumber()
    @IsNotEmpty()
    followers_count: number

    @IsNumber()
    @IsNotEmpty()
    following_count: number


    @IsNumber()
    @IsNotEmpty()
    tweet_count: number

    @IsNumber()
    @IsNotEmpty()
    listed_count: number

    @IsNumber()
    @IsNotEmpty()
    like_count: number

    @IsNumber()
    @IsNotEmpty()
    media_count: number
}


export class XUserDto implements XUser {
    @IsString()
    @IsNotEmpty()
    id: string

    @IsString()
    @IsNotEmpty()
    username: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    description: string

    @IsString()
    location: string

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => XPublicMetricsDto)
    public_metrics: XPublicMetricsDto

    @IsString()
    url: string

    @IsBoolean()
    verified: boolean

    @IsEnum(XVerifiedType)
    verified_type: XVerifiedType

    entities: any

    @IsString()
    profile_image_url: string

    @IsString()
    profile_banner_url: string

    @IsString()
    @IsNotEmpty()
    created_at: string

    @IsString()
    most_recent_tweet_id: string

    @IsBoolean()
    protected: boolean

    @IsString()
    pinned_tweet_id: string
}

export class CreateSocialDto {

    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsNotEmpty()
    @IsEnum(SocialProvider)
    provider: SocialProvider

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Object, {
        // 根据provider字段动态确定details的类型
        discriminator: {
            property: 'provider',
            subTypes: [
                { value: XUserDto, name: SocialProvider.X },
            ]
        }
    })
    details: XUserDto
}