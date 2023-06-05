import { Request as ExpressRequest } from 'express'

export interface PetRequest extends ExpressRequest {
  file: any
}
