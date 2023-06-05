import { Schema } from 'mongoose'
import { Role } from '../models/User'

export interface RequestUser {
  _id?: Schema.Types.ObjectId
  email: string
  role: Role
}
