import express from 'express'
import authRouter from './auth'
import sessionRouter from './session'
import petRouter from './pet'
import swaggerUi from 'swagger-ui-express'

const router = express.Router()

router.use('/auth', authRouter)
router.use('/session', sessionRouter)
router.use('/pet', petRouter)
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
