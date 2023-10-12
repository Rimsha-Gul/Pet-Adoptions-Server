import express from 'express'
import { ApplicationController } from '../controllers/application'
import {
  applicationIDValidation,
  applyForPetValidation,
  getAllApplicationsValidation,
  getTimeSlotsValidation,
  scheduleVisitValidation,
  statusValidation
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
  '/:applicationID/homeVisit',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const idError = applicationIDValidation(req.params).error
    const visitError = scheduleVisitValidation(req.body).error

    if (idError || visitError) {
      return res
        .status(400)
        .send(
          idError ? idError.details[0].message : visitError?.details[0].message
        )
    }
    try {
      const applicationID = req.params.applicationID as string
      const response = await controller.scheduleHomeVisit(
        applicationID,
        req.body
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.post(
  '/:applicationID/shelterVisit',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const idError = applicationIDValidation(req.params).error
    const visitError = scheduleVisitValidation(req.body).error

    if (idError || visitError) {
      return res
        .status(400)
        .send(
          idError ? idError.details[0].message : visitError?.details[0].message
        )
    }
    try {
      const applicationID = req.params.applicationID as string
      const response = await controller.scheduleShelterVisit(
        applicationID,
        req.body
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.put(
  '/:applicationID/status',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const idError = applicationIDValidation(req.params).error
    const statusError = statusValidation(req.body).error

    if (idError || statusError) {
      return res
        .status(400)
        .send(
          idError ? idError.details[0].message : statusError?.details[0].message
        )
    }
    try {
      const applicationID = req.params.applicationID as string
      const response = await controller.updateApplicationStatus(
        applicationID,
        req.body
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.get(
  '/:applicationID',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const { error } = applicationIDValidation(req.params)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const applicationID = req.params.applicationID as string
      const response = await controller.getApplicationDetails(
        req,
        applicationID
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.get('/', authenticateAccessToken, async (req, res) => {
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

export default applicationRouter
