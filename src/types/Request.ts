import { Request as ExpressRequest } from "express";
import { RequestUser } from "./RequestUser";

export interface UserRequest extends ExpressRequest {
  user?: RequestUser;
}
