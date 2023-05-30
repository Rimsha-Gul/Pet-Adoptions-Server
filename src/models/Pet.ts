import { Document, Model, Schema, model } from 'mongoose'

export interface PetResponse {
  shelterId: Schema.Types.ObjectId
  name: string
  age: number
  color: string
  bio: string
  image: string
}

export interface PetDocument extends PetResponse, Document {}

const PetSchema = new Schema<PetDocument>(
  {
    shelterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    color: { type: String, required: true },
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
