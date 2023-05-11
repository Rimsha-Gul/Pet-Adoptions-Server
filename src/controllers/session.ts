//import { UserRequest } from "../types/Request";
import User from '../models/User'
import { SessionResponse } from '../models/User'
import { Example, Get, Hidden, Query, Route, Security, Tags } from 'tsoa'

@Security('bearerAuth')
@Route('session')
@Tags('Session')
export class SessionController {
  /**
   * @summary Get session info
   */
  @Example<SessionResponse>({
    name: 'John Doe',
    email: 'johndoe@example.com',
    address: '123 Main St'
  })
  @Get('/')
  public async session(
    @Query('req') @Hidden() req?: any
  ): Promise<SessionResponse> {
    return session(req)
  }
}

const session = async (req: any) => {
  const email = req.user!.email
  const user = await User.findOne({ email })
  return {
    name: user!.name,
    email: user!.email,
    address: user!.address
  }
}
