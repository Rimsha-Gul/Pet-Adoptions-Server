import { Visit } from '../models/Visit'
import { Review } from '../models/Review'
import moment from 'moment'

export const canReview = async (
  shelterId: string,
  userEmail: string
): Promise<boolean> => {
  const hasVisitDatePassed = Boolean(
    await Visit.findOne({
      shelterID: shelterId,
      applicantEmail: userEmail,
      visitDate: { $lt: moment().utc().toISOString() }
    })
  )

  const hasAlreadyReviewed = Boolean(
    await Review.findOne({
      shelterID: shelterId,
      applicantEmail: userEmail
    })
  )

  return hasVisitDatePassed && !hasAlreadyReviewed
}
