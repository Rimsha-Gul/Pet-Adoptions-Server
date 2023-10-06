import { model, Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcrypt'

export enum Role {
  Admin = 'ADMIN',
  Shelter = 'SHELTER',
  User = 'USER'
}

export enum EmailChangeRequest {
  currentEmailStep = 'currentEmailStep',
  newEmailStep = 'newEmailStep'
}

/**
 * @example {
 *  "name": "Jack Doe",
 *  "email": "jackdoe@example.com",
 *  "password": "123456",
 *  "role": "USER"
 * }
 */

export interface UserPayload {
  name: string
  email: string
  password: string
  role: Role
}

export interface LoginPayload {
  /**
   * Email of user
   * @example "jackdoe@example.com"
   */
  email: string
  /**
   * Password for user
   * @example "123456"
   */
  password: string
}

export interface SendCodePayload {
  /**
   * Email of user
   * @example "jackdoe@example.com"
   */
  email: string
  emailChangeRequest?: EmailChangeRequest
}

export interface VerificationPayload {
  /**
   * Email of user
   * @example "jackdoe@example.com"
   */
  email: string
  /**
   * Verification code of user
   * @example "654321"
   */
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
  role: Role
  address: string
  bio: string
  profilePhoto: string
}

export interface VerificationResponse extends TokenResponse {
  isVerified: boolean
}

export interface EmailPayload {
  /**
   * Email of user
   * @example "jackdoe@example.com"
   */
  email: string
}

export interface CheckPasswordPayload {
  /**
   * Password for user
   * @example "123456"
   */
  password: string
}

export interface UpdateProfilePayload {
  name?: string
  address?: string
  bio?: string
  profilePhoto?: string
  removeProfilePhoto?: boolean
}

export interface ShelterResponse {
  id: string
  name: string
}

export interface ShelterProfileResponse {
  profilePhoto: string
  name: string
  email: string
  address: string
  bio: string
  rating: number
  numberOfReviews: number
  canReview: boolean
}

export interface UserDocument extends UserResponse, Document {
  role: Role
  address: string
  bio: string
  profilePhoto: string[]
  rating: number
  numberOfReviews: number
  isVerified: boolean
  verificationCode: {
    code: string
    createdAt: Date
    updatedAt: Date
  }
  passwordResetToken?: string
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

export interface VerifyInvitationPayload {
  invitationToken: string
}

export interface VerifyInvitationResponse {
  email: string
  role: Role
}

export interface ResetPasswordPayload {
  email: string
  newPassword: string
}

const UserSchema = new Schema<UserDocument>(
  {
    role: { type: String, enum: Role },
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String },
    bio: { type: String },
    profilePhoto: { type: [String] },
    rating: { type: Number },
    numberOfReviews: { type: Number },
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
    },
    passwordResetToken: { type: String }
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

export const User: IUserModel = model<IUser, IUserModel>('User', UserSchema)

export default User
