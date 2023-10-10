import { UserRequest } from '../types/Request'
import {
  Review,
  ReviewPayload,
  ReviewResponse,
  ReviewsResponse
} from '../models/Review'
import {
  Body,
  Example,
  Get,
  Post,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags
} from 'tsoa'
import { User } from '../models/User'
import { reviewsResponseExample } from '../examples/review'

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
  @Example<ReviewsResponse>(reviewsResponseExample)
  @Security('bearerAuth')
  @Get('/all')
  public async getReviews(
    @Query() shelterID: string,
    @Query('page') page: number,
    @Query('limit') limit: number
  ): Promise<ReviewsResponse> {
    return getReviews(shelterID, page, limit)
  }

  /**
   * @summary Updates review
   *
   */
  @Security('bearerAuth')
  @Put('/update')
  public async updateReview(
    @Body() body: ReviewPayload,
    @Request() req: UserRequest
  ) {
    return updateReview(body, req)
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

const getReviews = async (
  shelterID: string,
  page: number,
  limit: number
): Promise<ReviewsResponse> => {
  const skip = (page - 1) * limit

  const shelter = await User.findOne({ _id: shelterID })

  if (!shelter) {
    throw { code: 404, message: 'Shelter not found' }
  }

  const totalReviews = await Review.countDocuments({ shelterID: shelterID })
  const totalPages = Math.ceil(totalReviews / limit)

  const reviewDocs = await Review.find({ shelterID: shelterID })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)

  const reviews: ReviewResponse[] = reviewDocs.map((reviewDoc) => {
    return {
      applicantName: reviewDoc.applicantName,
      applicantEmail: reviewDoc.applicantEmail,
      rating: reviewDoc.rating,
      reviewText: reviewDoc.reviewText
    }
  })
  return {
    reviews: reviews,
    totalPages: totalPages
  }
}

const updateReview = async (body: ReviewPayload, req: UserRequest) => {
  // Check if the review to be updated exists
  const { shelterID, rating, reviewText } = body

  const existingReview = await Review.findOne({
    shelterID: shelterID,
    applicantEmail: req.user?.email
  })

  if (!existingReview) throw { code: 404, message: 'Review not found' }

  const user = await User.findOne({ email: req.user?.email })
  if (!user) throw { code: 404, message: 'User not found' }

  const oldRating = existingReview.rating // Store the old rating before updating

  existingReview.rating = rating
  existingReview.reviewText = reviewText

  await existingReview.save()

  // Fetch the shelter
  const shelter = await User.findOne({ _id: shelterID })

  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  // Calculate the new average rating
  // Subtract the old rating and add the new rating, then divide by the total number of reviews
  shelter.rating =
    (shelter.rating * shelter.numberOfReviews - oldRating + rating) /
    shelter.numberOfReviews

  await shelter.save()

  return { code: 200, message: 'Review updated successfully' }
}
