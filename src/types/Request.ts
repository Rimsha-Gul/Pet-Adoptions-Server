import { Request as ExpressRequest } from "express";
import { RequestUser } from "./RequestUser";

export interface Request extends ExpressRequest {
  user?: RequestUser;
}
