import { emitReadNotification } from '../socket'
import Notification, { NotificationPayload } from '../models/Notification'
import { Body, Put, Route, Security, Tags } from 'tsoa'

@Route('notification')
@Tags('Notification')
export class NotificationController {
  /**
   * @summary Accepts notification ID and marks it as read
   *
   */
  @Security('bearerAuth')
  @Put('/markAsRead')
  public async markAsRead(@Body() body: NotificationPayload) {
    return markAsRead(body)
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
