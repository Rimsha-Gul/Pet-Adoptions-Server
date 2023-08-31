import { Model, Schema, model } from 'mongoose'

export interface NotificationResponse {
  userEmail: string
  applicationID: Schema.Types.ObjectId
  message: string
  read: boolean
  actionUrl: string
  date: string
}

export interface NotificationDocument extends NotificationResponse, Document {}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userEmail: { type: String, ref: 'User', required: true },
    applicationID: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionUrl: { type: String, default: null },
    date: { type: String }
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
