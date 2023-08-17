import Joi from 'joi'
import { ActivityNeeds, Category, Gender, LevelOfGrooming } from '../models/Pet'
import { ResidenceType, Status } from '../models/Application'
import { Role } from '../models/User'
import { VisitType } from '../models/Visit'

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
const objectIDSchema = Joi.string().length(24).hex()
const residenceTypeSchema = Joi.string().valid(...Object.values(ResidenceType))
const statusSchema = Joi.string().valid(...Object.values(Status))
const visitTypeSchema = Joi.string().valid(...Object.values(VisitType))
const roleSchema = Joi.string().valid(...Object.values(Role))

const today = new Date()
const weekFromNow = new Date()
weekFromNow.setDate(weekFromNow.getDate() + 7)

export const signUpValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    name: nameSchema.required(),
    email: emailSchema.required(),
    password: passwordSchema.required(),
    role: roleSchema.required()
  }).validate(data)

export const loginValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    email: emailSchema.required(),
    password: passwordSchema.required()
  }).validate(data)

export const sendVerificationCodeValidation = (
  data: any
): Joi.ValidationResult =>
  Joi.object({
    email: emailSchema.required(),
    emailChangeRequest: Joi.boolean()
  }).validate(data)

export const verifyEmailValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    email: emailSchema.required(),
    verificationCode: Joi.string().required()
  }).validate(data)

export const updateProfileValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    bio: Joi.string(),
    removeProfilePhoto: Joi.boolean()
  }).validate(data)

export const emailValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    email: emailSchema.required()
  }).validate(data)

export const checkPasswordValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
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

export const getPetValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    id: Joi.string().length(10).required()
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

export const applyForPetValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    shelterID: objectIDSchema.required(),
    microchipID: Joi.string().length(10).required(),
    residenceType: residenceTypeSchema.required(),
    hasRentPetPermission: Joi.boolean().when('residenceType', {
      is: ResidenceType.Rent,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    hasChildren: Joi.boolean().required(),
    childrenAges: Joi.string().when('hasChildren', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    hasOtherPets: Joi.boolean().required(),
    otherPetsInfo: Joi.string().when('hasOtherPets', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    petAloneTime: Joi.number().integer().min(0).max(24).required(),
    hasPlayTimeParks: Joi.boolean().required(),
    petActivities: Joi.string().required(),
    handlePetIssues: Joi.string().required(),
    moveWithPet: Joi.string().required(),
    canAffordPetsNeeds: Joi.boolean().required(),
    canAffordPetsMediacal: Joi.boolean().required(),
    petTravelPlans: Joi.string().required(),
    petOutlivePlans: Joi.string().required()
  }).validate(data)

export const getAllApplicationsValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(3),
    searchQuery: Joi.string().allow('').optional(),
    applicationStatusFilter: Joi.string().allow('').optional()
  }).validate(data)

export const idValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    id: objectIDSchema.required()
  }).validate(data)

export const updateApplicationStatusValidation = (
  data: any
): Joi.ValidationResult =>
  Joi.object({
    id: objectIDSchema.required(),
    status: statusSchema.required()
  }).validate(data)

export const scheduleVisitValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    id: objectIDSchema.required(),
    visitDate: Joi.date().greater(today).less(weekFromNow).required(),
    visitType: visitTypeSchema.optional()
  }).validate(data)

export const addReviewValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    shelterID: objectIDSchema.required(),
    rating: Joi.number().integer().min(1).max(5),
    reviewText: Joi.string().required()
  }).validate(data)

export const getAllReviewsValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    id: objectIDSchema.required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(6)
  }).validate(data)

export const verifyInvitationTokenValidation = (
  data: any
): Joi.ValidationResult =>
  Joi.object({
    invitationToken: Joi.string().required()
  }).validate(data)

export const verifyResetTokenValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    resetToken: Joi.string().required()
  }).validate(data)

export const resetPasswordValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    email: emailSchema.required(),
    newPassword: passwordSchema.required()
  }).validate(data)
