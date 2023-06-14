import { Document, Model, Schema, model } from 'mongoose'

export enum Category {
  Cat = 'CAT',
  Dog = 'DOG',
  Horse = 'HORSE',
  Rabbit = 'RABBIT',
  Bird = 'BIRD',
  SmallAndFurry = 'SMALL_AND_FURRY',
  ScalesFinsAndOthers = 'SCALES_FINS_AND_OTHERS',
  Barnyard = 'BARNYARD'
}

export enum Gender {
  Male = 'MALE',
  Female = 'FEMALE'
}

export enum ActivityNeeds {
  Low = 'LOW',
  VeryLow = 'VERY_LOW',
  MidRange = 'MIDRANGE',
  High = 'HIGH',
  VeryHigh = 'VER_YHIGH'
}

export enum LevelOfGrooming {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH'
}

export interface PetPayload {
  microchipID: string
  name: string
  gender: string
  age: string
  color: string
  breed: string
  category: string
  activityNeeds: string
  levelOfGrooming: string
  isHouseTrained: string
  healthCheck: string
  allergiesTreated: string
  wormed: string
  heartwormTreated: string
  vaccinated: string
  deSexed: string
  bio: string
  traits: string
  adoptionFee: string
}

export interface PetsResponse {
  microchipID: string
  name: string
  gender: Gender
  age: string
  color: string
  breed: string
  category: Category
  activityNeeds: ActivityNeeds
  levelOfGrooming: LevelOfGrooming
  isHouseTrained: boolean
  healthInfo: {
    healthCheck: boolean
    allergiesTreated: boolean
    wormed: boolean
    heartwormTreated: boolean
    vaccinated: boolean
    deSexed: boolean
  }
  bio: string
  traits: string[]
  adoptionFee: string
  images: string[]
}

export interface AddPetResponse {
  pet: PetsResponse
}

export interface AllPetsResponse {
  pets: PetsResponse[]
  totalPages: number
  colors: string[]
  breeds: string[]
  genders: string[]
  ages: string[]
}

export interface PetResponse {
  microchipID: string
  name: string
  gender: Gender
  age: string
  color: string
  breed: string
  bio: string
  images: string[]
}

export interface PetDocument extends PetResponse, Document {
  shelterID: Schema.Types.ObjectId
  category: Category
  activityNeeds: ActivityNeeds
  levelOfGrooming: LevelOfGrooming
  isHouseTrained: boolean
  healthInfo: {
    healthCheck: boolean
    allergiesTreated: boolean
    wormed: boolean
    heartwormTreated: boolean
    vaccinated: boolean
    deSexed: boolean
  }
  traits: string[]
  adoptionFee: string
}

const PetSchema = new Schema<PetDocument>(
  {
    shelterID: { type: Schema.Types.ObjectId },
    microchipID: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, enum: Gender, required: true },
    age: { type: String, required: true },
    color: { type: String, required: true },
    breed: { type: String, required: true },
    category: { type: String, enum: Category, required: true },
    bio: { type: String, required: true },
    activityNeeds: { type: String, enum: ActivityNeeds, required: true },
    levelOfGrooming: { type: String, enum: LevelOfGrooming, required: true },
    isHouseTrained: { type: Boolean, required: true },
    healthInfo: {
      healthCheck: { type: Boolean, required: true },
      allergiesTreated: { type: Boolean, required: true },
      wormed: { type: Boolean, required: true },
      heartwormTreated: { type: Boolean, required: true },
      vaccinated: { type: Boolean, required: true },
      deSexed: { type: Boolean, required: true }
    },
    images: { type: [String], required: true },
    traits: { type: [String], required: true },
    adoptionFee: { type: String, required: true }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPet extends PetDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPetModel extends Model<IPet> {}

export const Pet: IPetModel = model<IPet, IPetModel>('Pet', PetSchema)

export default Pet
