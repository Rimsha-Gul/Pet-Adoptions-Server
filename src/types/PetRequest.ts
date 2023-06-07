import { Request as ExpressRequest } from 'express'

export interface PetRequest extends ExpressRequest {
  files: Express.Multer.File[]
}
