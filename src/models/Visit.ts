import { Model, Schema, model } from 'mongoose'

export enum VisitType {
  Home = 'Home',
  Shelter = 'Shelter'
}

export interface VisitDocument extends Document {
  applicationID: Schema.Types.ObjectId
  shelterID: Schema.Types.ObjectId
  petID: string
  applicantEmail: string
  visitType: VisitType
  visitDate: string
}

const VisitSchema = new Schema<VisitDocument>(
  {
    applicationID: { type: Schema.Types.ObjectId, required: true },
    shelterID: { type: Schema.Types.ObjectId, required: true },
    petID: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    visitType: { type: String, enum: VisitType, required: true },
    visitDate: { type: String, required: true }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IVisit extends VisitDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IVisitModel extends Model<IVisit> {}

export const Visit: IVisitModel = model<IVisit, IVisitModel>(
  'Visit',
  VisitSchema
)

export default Visit
