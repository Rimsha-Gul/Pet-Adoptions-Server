import { emitReadNotification } from '../socket'
import Notification, {
  AllNotificationsResponse,
  NotificationPayload
} from '../models/Notification'
import { Body, Get, Put, Query, Request, Route, Security, Tags } from 'tsoa'
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
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: UserRequest
  ): Promise<AllNotificationsResponse> {
    return getallNotifications(page, limit, req)
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

const markAsRead = async (body: NotificationPayload) => {
  const { id } = body

  const notification = await Notification.findById(id)

  if (!notification) throw { code: 404, message: 'Notification not found' }

  notification.isSeen = true
  notification.isRead = true
  notification.save()
  emitReadNotification(notification.userEmail, notification._id.toString())
  return { code: 200, message: 'Notification successfully marked as read' }
}
