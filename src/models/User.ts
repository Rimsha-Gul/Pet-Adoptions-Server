import { model, Model, Schema } from 'mongoose'
import bcrypt from 'bcrypt'

//import mongooseSequence from "mongoose-sequence";

//const AutoIncrement = mongooseSequence(mongoose);

//const AutoIncrement = AutoIncrementFactory(mongoose);

export interface UserPayload {
  name: string
  email: string
  address: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface TokenResponse {
  tokens: { accessToken: string; refreshToken: string }
}

export interface UserResponse extends TokenResponse, UserPayload {}

export interface SignupResponse extends SessionResponse, TokenResponse {}

export interface SessionResponse {
  name: string
  email: string
  address: string
}

// interface IUserModel extends Model<IUser> {
//   hashPassword(password: string): string
// }

export interface UserDocument extends UserResponse, Document {
  hashPassword(password: string): string
  comparePassword(password: string): boolean
}

export interface IUser extends UserDocument {
  comparePassword(password: string): boolean
}
interface IUserModel extends Model<IUser> {
  hashPassword(password: string): string
}

export interface UpdatedUser {
  email: string
  address?: string
}

export interface UpdatedUserResponse {
  success: boolean
  user?: UpdatedUser
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    tokens: {
      accessToken: { type: String },
      refreshToken: { type: String }
    }
  },
  { timestamps: true }
)

// Static Method to hash password
UserSchema.static('hashPassword', function (password: string): string {
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
})

// Instance Method to compare passwords
UserSchema.method('comparePassword', function (password: string): boolean {
  if (bcrypt.compareSync(password, this.password)) return true
  return false
})

//UserSchema.plugin(AutoIncrement, { inc_field: "id" });

export const User: IUserModel = model<IUser, IUserModel>('User', UserSchema)

export default User
