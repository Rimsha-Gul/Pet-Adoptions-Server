import { Request } from "../types/Request";
// interface UserResponse {
//     email: String
// }

export class SessionController {
  public async session(request: Request) {
    return session(request);
  }
}

const session = (req: Request) => ({
  email: req.user?.email,
});
