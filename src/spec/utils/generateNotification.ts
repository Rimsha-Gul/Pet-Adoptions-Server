import moment from 'moment'
import { Status } from '../../models/Application'
import { Notification } from '../../models/Notification'
import { getImageURL } from '../../utils/getImageURL'

export const generateNotification = async (applicationID: string) => {
  const notification = new Notification({
    userEmail: 'test@gmail.com',
    applicationID: applicationID,
    status: Status.UnderReview,
    petImage: getImageURL('mockFileID1'),
    isSeen: false,
    isRead: false,
    actionUrl: `/view/application/${applicationID}`,
    date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
  })
  await notification.save()

  const savedNotification = await Notification.findOne({
    userEmail: notification.userEmail,
    applicationID: notification.applicationID,
    status: notification.status
  })

  return savedNotification?._id.toString()
}

export const generateNotification2 = async (
  applicationID: string,
  status: Status
) => {
  const notification = new Notification({
    userEmail: 'test@gmail.com',
    applicationID: applicationID,
    status: status,
    petImage: getImageURL('mockFileID1'),
    isSeen: false,
    isRead: false,
    actionUrl: `/view/application/${applicationID}`,
    date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
  })
  await notification.save()

  const notificationWithId = {
    ...notification,
    id: notification._id.toString()
  }

  return notificationWithId
}

export const removeAllNotifications = async () => {
  await Notification.deleteMany({})
}
