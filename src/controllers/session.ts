import { getImageURL } from '../utils/getImageURL'
import { sessionResponseExample } from '../examples/session'
import User, { SessionResponse } from '../models/User'
import { UserRequest } from '../types/Request'
import { RequestUser } from '../types/RequestUser'
import { Example, Get, Request, Route, Security, Tags } from 'tsoa'

@Security('bearerAuth')
@Route('session')
@Tags('Session')
export class SessionController {
  /**
   * @summary Get a user's session info
   */
  @Example<SessionResponse>(sessionResponseExample)
  @Get('/')
  public async session(@Request() req: UserRequest): Promise<SessionResponse> {
    return session(req)
  }
}

const session = async (req: UserRequest) => {
  const email = (req.user as RequestUser).email
  const user = await User.findOne({ email })
  if (user) {
    let profilePhotoUrl
    if (user.profilePhoto.length > 0) {
      profilePhotoUrl = getImageURL(user.profilePhoto[0])
    }
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      bio: user.bio,
      profilePhoto: profilePhotoUrl
    }
  }
  throw { code: 404, message: 'User not found' }
}
