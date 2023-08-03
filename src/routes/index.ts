import express from 'express'
import authRouter from './auth'
import sessionRouter from './session'
import petRouter from './pet'
import swaggerUi from 'swagger-ui-express'
import applicationRouter from './application'
import shelterRouter from './shelter'
import reviewRouter from './review'

const router = express.Router()

router.use('/auth', authRouter)
router.use('/session', sessionRouter)
router.use('/pet', petRouter)
router.use('/application', applicationRouter)
router.use('/shelter', shelterRouter)
router.use('/review', reviewRouter)
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger.yaml'
    }
  })
)

export default router
