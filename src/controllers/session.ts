import { Request } from "../types/Request";
import User from "../models/User";
import { SessionResponse } from "../models/User";

export class SessionController {
  public async session(request: Request): Promise<SessionResponse> {
    return session(request);
  }
}

const session = async (req: Request) => {
  const email = req.user?.email;
  const user = await User.findOne({ email });
  return {
    name: user!.name,
    email: user!.email,
    address: user!.address,
  };
};
