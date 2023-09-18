import { emitReadNotification } from '../socket'
import Notification, {
  NotificationPayload,
  NotificationResponse
} from '../models/Notification'
import { Body, Get, Put, Request, Route, Security, Tags } from 'tsoa'
import { UserRequest } from '../types/Request'
import { User } from '../models/User'

@Route('notification')
@Security('bearerAuth')
@Tags('Notification')
export class NotificationController {
  /**
   * @summary Returns all notifications of the user
   *
   */
  @Get('/')
  public async getallNotifications(
    @Request() req: UserRequest
  ): Promise<NotificationResponse[]> {
    return getallNotifications(req)
  }
  /**
   * @summary Accepts notification ID and marks it as read
   *
   */
  @Put('/markAsRead')
  public async markAsRead(@Body() body: NotificationPayload) {
    return markAsRead(body)
  }
}

const getallNotifications = async (
  req: UserRequest
): Promise<NotificationResponse[]> => {
  let user
  if (req.user) {
    user = await User.findOne({ email: req.user.email })
  }
  if (!user) throw { code: 404, message: 'User not found' }
  const notifications = await Notification.find({ userEmail: user.email }).sort(
    { date: -1 }
  )

  return notifications.map((notification) => ({
    id: notification._id.toString(),
    userEmail: notification.userEmail,
    applicationID: notification.applicationID,
    status: notification.status,
    petImage: notification.petImage,
    isSeen: notification.isSeen,
    isRead: notification.isRead,
    actionUrl: notification.actionUrl,
    date: notification.date
  }))
}

const markAsRead = async (body: NotificationPayload) => {
  const { id } = body

  const notification = await Notification.findById(id)

  if (!notification) throw { code: 404, message: 'Notification not found' }

  notification.isSeen = true
  notification.isRead = true
  notification.save()
  console.log('read hehe')
  emitReadNotification(notification.userEmail, notification._id.toString())
  return { code: 200, message: 'Notification successfully marked as read' }
}
