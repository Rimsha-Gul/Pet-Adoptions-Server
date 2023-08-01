import { UserRequest } from '../types/Request'
import {
  Review,
  ReviewPayload,
  ReviewResponse,
  ReviewsResponse
} from '../models/Review'
import { Body, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { User } from '../models/User'

@Route('review')
@Tags('Review')
export class ReviewController {
  /**
   * @summary Accepts rating and review and adds the review in the database
   *
   */
  @Security('bearerAuth')
  @Post('/')
  public async addReview(
    @Body() body: ReviewPayload,
    @Request() req: UserRequest
  ) {
    return addReview(body, req)
  }

  /**
   * @summary Returns all reviews of a specific shelter
   *
   */
  @Security('bearerAuth')
  @Get('/all')
  public async getReviews(
    @Request() req: UserRequest
  ): Promise<ReviewsResponse> {
    return getReviews(req)
  }
}

const addReview = async (body: ReviewPayload, req: UserRequest) => {
  // Check if a review already exists from this user for this shelter
  const { shelterID, rating, reviewText } = body
  const existingReview = await Review.findOne({
    shelterID: shelterID,
    applicantEmail: req.user?.email
  })

  if (existingReview) {
    throw { code: 400, message: 'Review already exists' }
  }

  const user = await User.findOne({ email: req.user?.email })
  if (!user) throw { code: 404, message: 'User not found' }

  const newReview = new Review({
    shelterID: body.shelterID,
    applicantEmail: req.user?.email,
    applicantName: user.name,
    rating: rating,
    reviewText: reviewText
  })

  await newReview.save()

  // Fetch the shelter
  const shelter = await User.findOne({ _id: shelterID })

  if (!shelter) {
    throw { code: 404, message: 'Shelter not found' }
  }

  // Update the total rating and the count of reviews
  shelter.numberOfReviews += 1

  // Calculate the new average rating
  shelter.rating =
    (shelter.rating * (shelter.numberOfReviews - 1) + rating) /
    shelter.numberOfReviews

  await shelter.save()

  return { code: 200, message: 'Thank you for your feedback' }
}

const getReviews = async (req: UserRequest): Promise<ReviewsResponse> => {
  const shelterID = req.query.id
  const reviewDocs = await Review.find({ shelterID: shelterID })

  const reviews: ReviewResponse[] = reviewDocs.map((reviewDoc) => {
    return {
      applicantName: reviewDoc.applicantName,
      rating: reviewDoc.rating,
      reviewText: reviewDoc.reviewText
    }
  })

  return { reviews: reviews }
}
