import express from 'express'
import { ApplicationController } from '../controllers/application'
import {
  applyForPetValidation,
  getAllApplicationsValidation,
  getTimeSlotsValidation,
  idValidation,
  scheduleVisitValidation,
  updateApplicationStatusValidation
} from '../utils/validation'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { isUser } from '../middleware/isUser'
import { isShelter } from '../middleware/isShelter'

const applicationRouter = express.Router()
const controller = new ApplicationController()

applicationRouter.post(
  '/',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const { error } = applyForPetValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.applyForAPet(req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.get(
  '/',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const { error } = idValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const id = req.query.id as string
      const response = await controller.getApplicationDetails(req, id)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.get('/all', authenticateAccessToken, async (req, res) => {
  const { error } = getAllApplicationsValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const {
      page = '1',
      limit = '5',
      searchQuery,
      applicationStatusFilter
    } = req.query

    const response = await controller.getApplications(
      parseInt(page as string),
      parseInt(limit as string),
      req,
      searchQuery as string,
      applicationStatusFilter as string
    )
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

applicationRouter.get(
  '/timeSlots',
  authenticateAccessToken,
  async (req, res) => {
    const { error } = getTimeSlotsValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const { shelterID, petID, visitDate, visitType } = req.query
      const response = await controller.getTimeSlots(
        shelterID as string,
        petID as string,
        visitDate as string,
        visitType as string
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.post(
  '/homeVisit',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const { error } = scheduleVisitValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.scheduleHomeVisit(req.body)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.post(
  '/shelterVisit',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const { error } = scheduleVisitValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.scheduleShelterVisit(req.body)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.put(
  '/status',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const { error } = updateApplicationStatusValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.updateApplicationStatus(req.body)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default applicationRouter
