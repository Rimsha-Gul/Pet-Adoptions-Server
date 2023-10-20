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

export const generateNotifications = async (applicationID: string) => {
  const notificationsData = [
    {
      userEmail: 'test@gmail.com',
      applicationID: applicationID,
      status: Status.UnderReview,
      petImage: getImageURL('mockFileID1'),
      isSeen: false,
      isRead: false,
      actionUrl: `/view/application/${applicationID}`,
      date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    },
    {
      userEmail: 'test@gmail.com',
      applicationID: applicationID,
      status: Status.HomeVisitRequested,
      petImage: getImageURL('mockFileID1'),
      isSeen: false,
      isRead: false,
      actionUrl: `/view/application/${applicationID}`,
      date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    },
    {
      userEmail: 'test@gmail.com',
      applicationID: applicationID,
      status: Status.HomeApproved,
      petImage: getImageURL('mockFileID1'),
      isSeen: false,
      isRead: false,
      actionUrl: `/view/application/${applicationID}`,
      date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    },
    {
      userEmail: 'test@gmail.com',
      applicationID: applicationID,
      status: Status.UserVisitScheduled,
      petImage: getImageURL('mockFileID1'),
      isSeen: false,
      isRead: false,
      actionUrl: `/view/application/${applicationID}`,
      date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    },
    {
      userEmail: 'test@gmail.com',
      applicationID: applicationID,
      status: Status.Approved,
      petImage: getImageURL('mockFileID1'),
      isSeen: false,
      isRead: false,
      actionUrl: `/view/application/${applicationID}`,
      date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    }
  ]

  const notifications = notificationsData.map((data) => new Notification(data))
  await Notification.insertMany(notifications)
}

export const removeAllNotifications = async () => {
  await Notification.deleteMany({})
}
