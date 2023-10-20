import { Model, Schema, model } from 'mongoose'
import { Status } from './Application'

export interface NotificationResponse {
  id: string
  userEmail: string
  applicationID: string
  status: Status
  petImage: string
  isSeen: boolean
  isRead: boolean
  actionUrl: string
  date: string
}

export interface AllNotificationsResponse {
  notifications: NotificationResponse[]
  totalPages: number
}

export interface NotificationDocument
  extends Omit<NotificationResponse, 'id' | 'applicationID'>,
    Document {
  applicationID: Schema.Types.ObjectId
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userEmail: { type: String, ref: 'User', required: true },
    applicationID: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    status: { type: String, enum: Status, required: true },
    petImage: { type: String, required: true },
    isSeen: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String },
    date: { type: String, required: true }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface INotification extends NotificationDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface INotificationModel extends Model<INotification> {}

export const Notification: INotificationModel = model<
  INotification,
  INotificationModel
>('Notification', NotificationSchema)

export default Notification
