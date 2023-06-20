import Joi from 'joi'
import { ActivityNeeds, Category, Gender, LevelOfGrooming } from '../models/Pet'

const nameSchema = Joi.string().min(3).max(32)
const emailSchema = Joi.string().email()
const passwordSchema = Joi.string().min(6).max(1024)

const petNameSchema = Joi.string().min(3).max(32)
const petCategorySchema = Joi.string().valid(...Object.values(Category))
const petGenderSchema = Joi.string().valid(...Object.values(Gender))
const petActivityNeedsSchema = Joi.string().valid(
  ...Object.values(ActivityNeeds)
)
const petLevelOfGroomingSchema = Joi.string().valid(
  ...Object.values(LevelOfGrooming)
)

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
    microchipID: Joi.string().length(10).required(),
    name: petNameSchema.required(),
    gender: petGenderSchema.required(),
    birthDate: Joi.date().less('now').required(),
    color: Joi.string().required(),
    breed: Joi.string().required(),
    category: petCategorySchema.required(),
    activityNeeds: petActivityNeedsSchema.required(),
    levelOfGrooming: petLevelOfGroomingSchema.required(),
    isHouseTrained: Joi.boolean().required(),
    healthCheck: Joi.boolean().required(),
    allergiesTreated: Joi.boolean().required(),
    wormed: Joi.boolean().required(),
    heartwormTreated: Joi.boolean().required(),
    vaccinated: Joi.boolean().required(),
    deSexed: Joi.boolean().required(),
    bio: Joi.string().required(),
    traits: Joi.string().required(),
    adoptionFee: Joi.string().required(),
    shelterID: Joi.string().optional()
  }).validate(data)

export const getAllPetsValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(3),
    searchQuery: Joi.string().allow('').optional(),
    filterOption: petCategorySchema.allow('').optional(),
    colorFilter: Joi.string().allow('').optional(),
    breedFilter: Joi.string().allow('').optional(),
    genderFilter: petGenderSchema.allow('').optional(),
    ageFilter: Joi.string().allow('').optional()
  }).validate(data)
