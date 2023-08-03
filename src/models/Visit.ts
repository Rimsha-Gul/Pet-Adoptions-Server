import { Model, Schema, model } from 'mongoose'

export interface VisitDocument extends Document {
  visitDate: string
  shelterID: Schema.Types.ObjectId
  applicantEmail: string
}

const VisitSchema = new Schema<VisitDocument>(
  {
    shelterID: { type: Schema.Types.ObjectId, required: true },
    applicantEmail: { type: String, required: true },
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
