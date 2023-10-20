import { Model, Schema, model } from 'mongoose'

export interface ReviewPayload {
  /**
   * User's given rating of shelter
   * @example "5"
   */
  rating: number
  /**
   * User's given review text of shelter
   * @example "Animal Haven Shelter provided an incredibly positive adoption experience. Highly recommended for anyone looking to adopt a pet."
   */
  reviewText: string
}

export interface ReviewResponse {
  applicantName: string
  applicantEmail: string
  rating: number
  reviewText: string
}

export interface ReviewsResponse {
  reviews: ReviewResponse[]
  totalPages: number
}

export interface ReviewDocument
  extends Omit<ReviewPayload, 'shelterID'>,
    Document {
  shelterID: Schema.Types.ObjectId
  applicantEmail: string
  applicantName: string
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    shelterID: { type: Schema.Types.ObjectId, required: true },
    applicantEmail: { type: String, required: true },
    applicantName: { type: String, required: true },
    rating: { type: Number, required: true },
    reviewText: { type: String, required: true }
  },
  { timestamps: true }
)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IReview extends ReviewDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IReviewModel extends Model<IReview> {}

export const Review: IReviewModel = model<IReview, IReviewModel>(
  'Review',
  ReviewSchema
)

export default Review
