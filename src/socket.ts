import { Server, Socket } from 'socket.io'
import { Notification, NotificationResponse } from './models/Notification'

// Initialize Socket.io
export const io = new Server({
  cors: {
    origin: process.env.WEB_APP_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

io.on('connection', (socket: Socket) => {
  console.log('New client connected')

  socket.on('join_room', async (userEmail: string) => {
    console.log(`Joining room for email: ${userEmail}`)
    socket.join(`user-room-${userEmail}`)
  })

  socket.on('mark_notifications_as_seen', async (userEmail: string) => {
    await Notification.updateMany(
      { userEmail, isRead: false, isSeen: false },
      { $set: { isSeen: true } }
    )
    socket.emit('notifications_marked_as_seen')
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})

export const emitUserNotification = async (
  userEmail: string,
  data: NotificationResponse
) => {
  console.log(`Emitting user notification to email: ${userEmail}`)

  io.to(`user-room-${userEmail}`).emit('new_notification', data)
}

export const emitReadNotification = async (
  userEmail: string,
  notificationID: string
) => {
  console.log(`Emitting read notification to email: ${userEmail}`)

  io.to(`user-room-${userEmail}`).emit(
    'notification_marked_as_read',
    notificationID
  )
}
