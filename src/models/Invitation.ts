import { Model, Schema, model } from 'mongoose'

export enum InvitationStatus {
  Accepted = 'Accepted',
  Pending = 'Pending'
}

export interface InvitationDocument extends Document {
  shelterEmail: string
  invitationToken: string
  status: InvitationStatus
}

const InvitationSchema = new Schema<InvitationDocument>(
  {
    shelterEmail: { type: String, required: true },
    invitationToken: { type: String },
    status: { type: String, enum: InvitationStatus }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IInvitation extends InvitationDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IInvitationModel extends Model<IInvitation> {}

export const Invitation: IInvitationModel = model<
  IInvitation,
  IInvitationModel
>('Invitation', InvitationSchema)

export default Invitation
