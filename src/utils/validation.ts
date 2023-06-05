import Joi from 'joi'
import { Category } from '../models/Pet'

const nameSchema = Joi.string().min(3).max(32)
const emailSchema = Joi.string().email()
const passwordSchema = Joi.string().min(6).max(1024)

const petNameSchema = Joi.string().min(3).max(32)

const categorySchema = Joi.string().valid(...Object.values(Category))

export const signUpValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    name: nameSchema.required(),
    email: emailSchema.required(),
    password: passwordSchema.required()
  }).validate(data)

export const loginValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    email: emailSchema.required(),
    password: passwordSchema.required()
  }).validate(data)

export const addPetValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    name: petNameSchema.required(),
    age: Joi.number().required(),
    color: Joi.string().required(),
    category: categorySchema.required(),
    bio: Joi.string().required()
  }).validate(data)
