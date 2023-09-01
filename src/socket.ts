import { Server, Socket } from 'socket.io'
import { Notification, NotificationResponse } from './models/Notification'

// Initialize Socket.io
export const io = new Server({
  cors: {
    origin: 'http://127.0.0.1:5173',
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

  //   socket.on(
  //     'create_notification',
  //     async (notification: NotificationResponse) => {
  //       console.log('Creating a new notification:', notification)

  //       // Create a new Notification document in MongoDB
  //       const newNotification = new Notification(notification)
  //       await newNotification.save()

  //       const room = `user-room-${notification.userEmail}`
  //       console.log(`Emitting new notification to room: ${room}`)
  //       io.to(room).emit('new_notification', newNotification)
  //     }
  //   )

  socket.on('get_notifications', async (userEmail: string) => {
    console.log('Fetching all notifications')

    // Fetch all notifications from MongoDB
    const allNotifications = await Notification.find({
      userEmail: userEmail
    }).sort({ date: -1 })

    console.log('notifications', allNotifications)
    socket.emit('notifications', allNotifications)
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
  console.log('Data being emitted:', data)

  io.to(`user-room-${userEmail}`).emit('new_notification', data)
}
