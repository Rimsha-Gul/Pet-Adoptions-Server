import { emitReadNotification } from '../socket'
import Notification, { AllNotificationsResponse } from '../models/Notification'
import {
  Example,
  Get,
  Path,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags
} from 'tsoa'
import { UserRequest } from '../types/Request'
import { User } from '../models/User'
import { notificationsResponseExample } from '../examples/notification'

@Route('notification')
@Security('bearerAuth')
@Tags('Notification')
export class NotificationController {
  /**
   * @summary Returns all notifications of the user
   *
   */
  @Example<AllNotificationsResponse>(notificationsResponseExample)
  @Get('/')
  public async getallNotifications(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: UserRequest
  ): Promise<AllNotificationsResponse> {
    return getallNotifications(page, limit, req)
  }
  /**
   * @summary Accepts notification ID and marks it as read
   *
   * @param notificationID ID of the notification
   * @example id "6523fdbb5f59f9eb98f3163b"
   */
  @Put('/:notificationID/read')
  public async markAsRead(@Path() notificationID: string) {
    return markAsRead(notificationID)
  }
}

const getallNotifications = async (
  page: number,
  limit: number,
  req: UserRequest
): Promise<AllNotificationsResponse> => {
  let user
  if (req.user) {
    user = await User.findOne({ email: req.user.email })
  }
  if (!user) throw { code: 404, message: 'User not found' }
  // // Calculate total number of notifications for the user
  const totalNotifications = await Notification.countDocuments({
    userEmail: user.email
  })
  const totalPages = Math.ceil(totalNotifications / limit)

  // Adjust the query to use skip and limit for pagination
  const notifications = await Notification.find({ userEmail: user.email })
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  return {
    notifications: notifications.map((notification) => ({
      id: notification._id.toString(),
      userEmail: notification.userEmail,
      applicationID: notification.applicationID.toString(),
      status: notification.status,
      petImage: notification.petImage,
      isSeen: notification.isSeen,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      date: notification.date
    })),
    totalPages: totalPages
  }
}

const markAsRead = async (notificationID: string) => {
  const notification = await Notification.findById(notificationID)

  if (!notification) throw { code: 404, message: 'Notification not found' }

  notification.isSeen = true
  notification.isRead = true
  notification.save()
  emitReadNotification(notification.userEmail, notification._id.toString())
  return { code: 200, message: 'Notification successfully marked as read' }
}
