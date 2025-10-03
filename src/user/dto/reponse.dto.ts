import { Credit } from "../../schemas/credit.schema"
import { Social } from "../../schemas/social.schema"
import { User } from "../../schemas/user.schema"
import { AnonymousIdentity } from "../../schemas/anonymout-identity.schema"
import { Funds } from "../../schemas/funds.schema"

export interface UserInfo extends User {
    socials?: Array<Omit<Social, 'userId'>>
    credit?: Omit<Credit, 'userId'>
    funds?: Omit<Funds, 'userId'>
    anonymousIdentities?: Array<Omit<AnonymousIdentity, 'userId'>>
}

export interface Contributor {
    userId: string
    accessToken: string
}