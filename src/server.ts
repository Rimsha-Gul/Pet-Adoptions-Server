import { app, dbPromise } from './app'

/***********************************
 *         Starting server         *
 ***********************************/

dbPromise?.then(() => {
  try {
    const port = process.env.PORT

    app.listen(`${port}`, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  } catch (err) {
    console.error('Error starting the server: ', err)
  }
})
