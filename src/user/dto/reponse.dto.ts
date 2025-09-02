import { Point } from "src/schemas/point.schema"
import { Social } from "src/schemas/social.schema"
import { User } from "src/schemas/user.schema"

export interface UserInfo extends User {
    socials?: Array<Omit<Social, 'userId'>>
    points?: Omit<Point, 'userId'>
}
