import UserModel from "../models/User";

export const createUser = (values: Record<string, any>) =>
  new UserModel(values).save().then((user) => user.toObject());
