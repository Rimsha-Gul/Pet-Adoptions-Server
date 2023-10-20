import { Document, Model, Schema, model } from 'mongoose'

export enum ResidenceType {
  Own = 'ownHouse',
  Rent = 'rentHouse'
}

export enum Status {
  UnderReview = 'Under Review',
  HomeVisitRequested = 'Home Visit Requested',
  HomeVisitScheduled = 'Home Visit Scheduled',
  HomeApproved = 'Home Approved',
  HomeRejected = 'Home Rejected',
  UserVisitScheduled = 'User Visit Scheduled',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Closed = 'Closed',
  Expired = 'Expired',
  ReactivationRequested = 'Reactivation Requested',
  ReactivationRequestApproved = 'Reactivation Request Approved',
  ReactivationRequestDeclined = 'Reactivation Request Declined'
}

export interface UpdateApplicationPayload {
  status: Status
}

/**
 * @example {
 *  "shelterID": "6475e9630044288a2b4880b5",
 *  "microchipID": "A123456789",
 *  "residenceType": "rentHouse",
 *  "hasRentPetPermission": "true",
 *  "hasChildren": "true",
 *  "childrenAges": "2,4",
 *  "hasOtherPets": "true",
 *  "otherPetsInfo": "Cat 1, Dog 2",
 *  "petAloneTime": "4",
 *  "hasPlayTimeParks": "true",
 *  "petActivities": "walking, playing around the house, swimming, sky diving",
 *  "handlePetIssues": "i will pat him",
 *  "moveWithPet": "i will take him with me",
 *  "canAffordPetsNeeds": "true",
 *  "canAffordPetsMedical": "true",
 *  "petTravelPlans": "i will take him wherever i go",
 *  "petOutlivePlans": "My friend, Alex will take care of him"
 * }
 */
export interface ApplicationPayload {
  shelterID: string
  microchipID: string
  residenceType: ResidenceType
  hasRentPetPermission: boolean
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
  canAffordPetsMedical: boolean
  petTravelPlans: string
  petOutlivePlans: string
}

export interface ScheduleVisitPayload {
  /**
   * Date for visit
   * @example "2023-08-19T04:00:00Z"
   */
  visitDate: string
}

export interface TimeSlotsResponse {
  availableTimeSlots: string[]
}

export interface ApplictionResponseShelter extends ApplicationPayload {
  id: string
  status: Status
  applicantEmail: string
  applicantName: string
  submissionDate: Date
  petImage: string
  petName: string
}

export interface ApplictionResponseForShelter {
  application: ApplictionResponseShelter
}

export interface ApplicationResponse extends ApplicationPayload {
  id: string
  status: Status
  submissionDate: string
  microchipID: string
  petImage: string
  petName: string
  shelterName: string
  applicantName?: string
  homeVisitDate?: string
  shelterVisitDate?: string
  homeVisitEmailSentDate?: string
  shelterVisitEmailSentDate?: string
}

export interface ApplictionResponseForUser {
  application: ApplicationResponse
  canReview?: boolean
}

export interface AllApplicationsResponse {
  applications: ApplicationResponse[]
  totalPages: number
  applicationStatuses: string[]
}

export interface ApplicationDocument
  extends Omit<ApplicationPayload, 'shelterID'>,
    Document {
  shelterID: Schema.Types.ObjectId
  applicantEmail: string
  status: Status
  createdAt: Date
  homeVisitDate: string
  shelterVisitDate: string
  homeVisitEmailSentDate: string
  shelterVisitEmailSentDate: string
  homeVisitScheduleExpiryDate: string
  shelterVisitScheduleExpiryDate: string
}

const ApplicationSchema = new Schema<ApplicationDocument>(
  {
    shelterID: { type: Schema.Types.ObjectId, required: true },
    microchipID: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    residenceType: { type: String, enum: ResidenceType, required: true },
    hasRentPetPermission: { type: Boolean },
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
    canAffordPetsMedical: { type: Boolean, required: true },
    petTravelPlans: { type: String, required: true },
    petOutlivePlans: { type: String, required: true },
    status: { type: String, enum: Status },
    homeVisitDate: { type: String },
    shelterVisitDate: { type: String },
    homeVisitEmailSentDate: { type: String },
    shelterVisitEmailSentDate: { type: String },
    homeVisitScheduleExpiryDate: { type: String },
    shelterVisitScheduleExpiryDate: { type: String }
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
