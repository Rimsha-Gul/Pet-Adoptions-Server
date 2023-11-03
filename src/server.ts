import { createServer } from 'http'
import { app, dbPromise } from './app'
import { io } from './socket'

dbPromise?.then(() => {
  try {
    const port = process.env.PORT || 8080
    const appURL = process.env.WEB_APP_URL

    // Create HTTP server
    const httpServer = createServer(app)

    // Attach the io instance to the HTTP server
    io.attach(httpServer)

    httpServer.listen(port, () => {
      console.log(`⚡️[server]: Server is running at ${appURL}:${port}`)
    })
  } catch (err) {
    console.error('Error starting the server: ', err)
  }
})
