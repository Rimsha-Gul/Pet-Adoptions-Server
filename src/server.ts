import { createServer } from 'http'
import { app, dbPromise } from './app'
import { io } from './socket'

dbPromise?.then(() => {
  try {
    const port = process.env.PORT

    // Create HTTP server
    const httpServer = createServer(app)

    // Attach the io instance to the HTTP server
    io.attach(httpServer)

    httpServer.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  } catch (err) {
    console.error('Error starting the server: ', err)
  }
})
