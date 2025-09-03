import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
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
    confirmed_email: string

    @IsOptional()
    @IsString()
    location: string

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => XPublicMetricsDto)
    public_metrics: XPublicMetricsDto

    @IsOptional()
    @IsString()
    url: string

    @IsBoolean()
    verified: boolean

    @IsEnum(XVerifiedType)
    verified_type: XVerifiedType

    @IsOptional()
    entities: any

    @IsOptional()
    @IsString()
    profile_image_url: string

    @IsOptional()
    @IsString()
    profile_banner_url: string

    @IsString()
    @IsNotEmpty()
    created_at: string

    @IsString()
    most_recent_tweet_id: string

    @IsOptional()
    @IsBoolean()
    protected: boolean

    @IsOptional()
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
    @Type((options) => {
        // 手动根据顶级 provider 选择类型
        const provider = options?.object?.provider
        if (provider === SocialProvider.X) return XUserDto
        return Object
    })
    details: XUserDto
}