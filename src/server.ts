import { createServer } from 'http'
import { app, dbPromise } from './app'
import { io } from './socket'

dbPromise?.then(() => {
  try {
    const port = process.env.PORT || 8080
    const backendURL =
      process.env.NODE_ENV === 'production'
        ? `${process.env.SERVER_URL}`
        : `${process.env.SERVER_URL}:${port}`

    // Create HTTP server
    const httpServer = createServer(app)

    // Attach the io instance to the HTTP server
    io.attach(httpServer)

    httpServer.listen(port, () => {
      console.log(`⚡️[server]: Server is running at ${backendURL}`)
    })
  } catch (err) {
    console.error('Error starting the server: ', err)
  }
})
