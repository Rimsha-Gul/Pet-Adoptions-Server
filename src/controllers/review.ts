import { UserRequest } from '../types/Request'
import { Review, ReviewPayload } from '../models/Review'
import { Body, Post, Request, Route, Security, Tags } from 'tsoa'

@Route('review')
@Tags('Review')
export class ReviewController {
  /**
   * @summary Returns a shelter's details given id
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
}

const addReview = async (body: ReviewPayload, req: UserRequest) => {
  // Check if a review already exists from this user for this shelter
  const existingReview = await Review.findOne({
    shelterID: body.shelterID,
    applicantEmail: req.user?.email
  })

  if (existingReview) {
    throw { code: 400, message: 'Review already exists' }
  }

  const newReview = new Review({
    shelterID: body.shelterID,
    applicantEmail: req.user?.email,
    rating: body.rating,
    reviewText: body.reviewText
  })

  await newReview.save()

  return { status: 'Review added successfully' }
}
