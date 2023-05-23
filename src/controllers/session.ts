import User, { SessionResponse } from '../models/User'
import { UserRequest } from 'src/types/Request'
import { RequestUser } from 'src/types/RequestUser'
import { Example, Get, Request, Route, Security, Tags } from 'tsoa'

@Security('bearerAuth')
@Route('session')
@Tags('Session')
export class SessionController {
  /**
   * @summary Get a user's session info
   */
  @Example<SessionResponse>({
    name: 'John Doe',
    email: 'johndoe@example.com',
    address: '123 Main St'
  })
  @Get('/')
  public async session(@Request() req: UserRequest): Promise<SessionResponse> {
    return session(req)
  }
}

const session = async (req: UserRequest) => {
  const email = (req.user as RequestUser).email
  const user = await User.findOne({ email })
  if (user) {
    return {
      name: user.name,
      email: user.email,
      address: user.address
    }
  }
  throw { code: 404, message: 'User not found' }
}
