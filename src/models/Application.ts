import { Document, Model, Schema, model } from 'mongoose'

export enum ResidenceType {
  Own = 'ownHouse',
  Rent = 'rentHouse'
}

export interface ApplicationPayload {
  shelterID: string
  microchipID: string
  residenceType: ResidenceType
  hasRentPetPermission: boolean
  isWillingHomeInspection: boolean
  hasChildren: boolean
  childrenAges: string
  hasOtherPets: boolean
  otherPetsInfo: string
  petAloneTime: number
  hasPlayTimeParks: boolean
  petActivities: string
  handlePetIssues: string
  moveWithPet: string
  canAffordPetsNeeds: boolean
  canAffordPetsMediacal: boolean
  petTravelPlans: string
  petOutlivePlans: string
}

export interface ApplicationDocument
  extends Omit<ApplicationPayload, 'shelterID'>,
    Document {
  shelterID: Schema.Types.ObjectId
  applicantEmail: string
}

const ApplicationSchema = new Schema<ApplicationDocument>(
  {
    shelterID: { type: Schema.Types.ObjectId },
    microchipID: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    residenceType: { type: String, enum: ResidenceType, required: true },
    hasRentPetPermission: { type: Boolean },
    isWillingHomeInspection: { type: Boolean, required: true },
    hasChildren: { type: Boolean, required: true },
    childrenAges: { type: String },
    hasOtherPets: { type: Boolean, required: true },
    otherPetsInfo: { type: String },
    petAloneTime: { type: Number, required: true },
    hasPlayTimeParks: { type: Boolean, required: true },
    petActivities: { type: String, required: true },
    handlePetIssues: { type: String, required: true },
    moveWithPet: { type: String, required: true },
    canAffordPetsNeeds: { type: Boolean, required: true },
    canAffordPetsMediacal: { type: Boolean, required: true },
    petTravelPlans: { type: String, required: true },
    petOutlivePlans: { type: String, required: true }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IApplication extends ApplicationDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IApplicationModel extends Model<IApplication> {}

export const Application: IApplicationModel = model<
  IApplication,
  IApplicationModel
>('Application', ApplicationSchema)

export default Application
