import Joi from 'joi'

const nameSchema = Joi.string().min(3).max(32)
const emailSchema = Joi.string().email()
const passwordSchema = Joi.string().min(6).max(1024)

const petShelterIdSchema = Joi.number()
const petNameSchema = Joi.string().min(3).max(32)
const petAgeSchema = Joi.number()
const petColorSchema = Joi.string()
const petBioSchema = Joi.string()

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
    shelterId: petShelterIdSchema.required(),
    name: petNameSchema.required(),
    age: petAgeSchema.required(),
    color: petColorSchema.required(),
    bio: petBioSchema.required()
  }).validate(data)
