import { Model, Schema, model } from 'mongoose'

export interface ReactivationRequestPayload {
  applicationID: string
  reasonNotScheduled: string
  reasonToReactivate: string
}

export interface ReactivationRequestDocument
  extends Omit<ReactivationRequestPayload, 'applicationID'>,
    Document {
  applicationID: Schema.Types.ObjectId
  reasonNotScheduled: string
  reasonToReactivate: string
}

const ReactivationRequestSchema = new Schema<ReactivationRequestDocument>(
  {
    applicationID: { type: Schema.Types.ObjectId, required: true },
    reasonNotScheduled: { type: String, required: true },
    reasonToReactivate: { type: String, required: true }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IReactivationRequest extends ReactivationRequestDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IReactivationRequestModel extends Model<IReactivationRequest> {}

export const ReactivationRequest: IReactivationRequestModel = model<
  IReactivationRequest,
  IReactivationRequestModel
>('ReactivationRequest', ReactivationRequestSchema)

export default ReactivationRequest
