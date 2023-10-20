import { Model, Schema, model } from 'mongoose'

export interface ReactivationRequestPayload {
  /**
   * Reason for not scheduling visit
   * @example "I had an unexpected personal commitment that consumed my attention during that time, and I missed the scheduling window."
   */
  reasonNotScheduled: string
  /**
   * Reason for requesting to reactivate
   * @example "The commitment has been addressed, and I am now fully available to proceed with the visit scheduling."
   */
  reasonToReactivate: string
}

export interface ReactivationRequestDocument
  extends ReactivationRequestPayload,
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
