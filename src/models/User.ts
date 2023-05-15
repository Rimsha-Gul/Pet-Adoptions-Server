import mongoose, { Model } from 'mongoose'
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

export interface UserDocument extends UserResponse, Document {
  hashPassword(): Promise<void>
  comparePassword(enteredPassword: string): Promise<boolean>
}

export interface UpdatedUser {
  email: string
  address?: string
}

export interface UpdatedUserResponse {
  success: boolean
  user?: UpdatedUser
}

const UserSchema = new mongoose.Schema(
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

UserSchema.methods.hashPassword = async function (): Promise<void> {
  this.password = await bcrypt.hash(this.password, 10)
}

UserSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password)
}

// UserSchema.statics.hashPassword = async function (password: string) {
//   return await bcrypt.hash(password, 10)
// }

// UserSchema.statics.comparePassword = async function (
//   enteredPassword,
//   hashedPassword
// ) {
//   return await bcrypt.compare(enteredPassword, hashedPassword)
// }
//UserSchema.plugin(AutoIncrement, { inc_field: "id" });

const User: Model<UserDocument> = mongoose.model<UserDocument>(
  'user',
  UserSchema
)
export default User
