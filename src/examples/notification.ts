import { Status } from '../models/Application'

export const notificationsResponseExample = {
  notifications: [
    {
      id: '6523fdbb5f59f9eb98f3163b',
      userEmail: 'johndoe@example.com',
      applicationID: '6523d393da718fbc64f5b628',
      status: Status.HomeVisitRequested,
      petImage: 'https://example.com/images/fluffy1.jpg',
      isSeen: true,
      isRead: false,
      actionUrl: '/view/application/6523d393da718fbc64f5b628',
      date: '2023-10-09T13:18:51Z'
    },
    {
      id: '6524006181eca8f269f376d9',
      userEmail: 'johndoe@example.com',
      applicationID: '6523d393da718fbc64f5b628',
      status: Status.UserVisitScheduled,
      petImage: 'https://example.com/images/fluffy1.jpg',
      isSeen: true,
      isRead: false,
      actionUrl: '/view/application/6523d393da718fbc64f5b628',
      date: '2023-10-16T13:18:51Z'
    },
    {
      id: '6523f799f05d4012e0ab578c',
      userEmail: 'johndoe@example.com',
      applicationID: '6523d393da718fbc64f5b628',
      status: Status.Approved,
      petImage: 'https://example.com/images/fluffy1.jpg',
      isSeen: true,
      isRead: true,
      actionUrl: '/view/application/6523d393da718fbc64f5b628',
      date: '2023-10-24T13:18:51Z'
    }
  ],
  totalPages: 3
}
