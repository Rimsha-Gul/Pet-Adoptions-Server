import { model, Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcrypt'

//import mongooseSequence from "mongoose-sequence";

//const AutoIncrement = mongooseSequence(mongoose);

//const AutoIncrement = AutoIncrementFactory(mongoose);

export enum Role {
  Admin = 1,
  Shelter = 2,
  User = 3
}

export interface UserPayload {
  name: string
  email: string
  address?: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SendCodePayload {
  email: string
}

export interface VerificationPayload {
  email: string
  verificationCode: string
}

export interface TokenResponse {
  tokens: { accessToken: string; refreshToken: string }
}

export interface UserResponse extends TokenResponse, UserPayload {}

export interface SignupResponse {
  name: string
  email: string
}

export interface SessionResponse extends SignupResponse {
  name: string
  email: string
}

export interface VerificationResponse extends TokenResponse {
  isVerified: boolean
}

// interface IUserModel extends Model<IUser> {
//   hashPassword(password: string): string
// }

export interface UserDocument extends UserResponse, Document {
  role: Role
  isVerified: boolean
  verificationCode: {
    code: string
    createdAt: Date
    updatedAt: Date
  }
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
    role: { type: Number, enum: Role, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String },
    password: { type: String, required: true },
    isVerified: { type: Boolean, required: true, default: false },
    verificationCode: {
      code: { type: String },
      createdAt: { type: Date },
      updatedAt: { type: Date }
    },
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
