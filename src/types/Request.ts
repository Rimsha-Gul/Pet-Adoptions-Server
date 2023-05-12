import { Request } from "express";
import { RequestUser } from "./RequestUser";

export interface UserRequest extends Request {
  user?: RequestUser;
}
