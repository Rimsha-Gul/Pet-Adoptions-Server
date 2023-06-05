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

export interface PetResponse {
  name: string
  age: number
  color: string
  bio: string
  image: string
}

export interface PetDocument extends PetResponse, Document {
  shelterId: Schema.Types.ObjectId
  category: Category
}

const PetSchema = new Schema<PetDocument>(
  {
    shelterId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    color: { type: String, required: true },
    category: { type: String, enum: Category, required: true },
    bio: { type: String, required: true },
    image: { type: String, required: true }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPet extends PetDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPetModel extends Model<IPet> {}

export const Pet: IPetModel = model<IPet, IPetModel>('Pet', PetSchema)

export default Pet
