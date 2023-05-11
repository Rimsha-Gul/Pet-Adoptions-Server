import express from 'express'
import authRouter from './auth'
import sessionRouter from './session'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

const router = express.Router()
const swaggerDocument = YAML.load(
  'F:/TetraHex/Probation/Projects/express-ts/public/swagger.yaml'
)

router.use('/auth', authRouter)
router.use('/session', sessionRouter)
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

export default router
