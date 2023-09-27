import { User } from '../../models/User'
import { Review } from '../../models/Review'

export interface Review {
  shelterID: string
  rating: number
  reviewText: string
}

export const generateReview = async (shelterID: string) => {
  const review = new Review({
    shelterID: shelterID,
    applicantEmail: 'test@gmail.com',
    applicantName: 'Test User',
    rating: 5,
    reviewText: 'Great shelter!'
  })
  await review.save()

  const shelter = await User.findOne({ _id: shelterID })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  shelter.numberOfReviews = 1
  shelter.rating = 5
  await shelter.save()
}

export const generateReviews = async (shelterID: string) => {
  const reviewsData = [
    {
      shelterID: shelterID,
      applicantEmail: 'test@gmail.com',
      applicantName: 'Test User',
      rating: 5,
      reviewText: 'Great shelter!'
    },
    {
      shelterID: shelterID,
      applicantEmail: 'test2@gmail.com',
      applicantName: 'Test User',
      rating: 4,
      reviewText: 'Good shelter!'
    },
    {
      shelterID: shelterID,
      applicantEmail: 'test3@gmail.com',
      applicantName: 'Test User',
      rating: 5,
      reviewText: 'Great shelter!'
    },
    {
      shelterID: shelterID,
      applicantEmail: 'test4@gmail.com',
      applicantName: 'Test User',
      rating: 4,
      reviewText: 'Good shelter!'
    },
    {
      shelterID: shelterID,
      applicantEmail: 'test5@gmail.com',
      applicantName: 'Test User',
      rating: 5,
      reviewText: 'Great shelter!'
    }
  ]

  const reviews = reviewsData.map((data) => new Review(data))
  await Review.insertMany(reviews)
}

export const removeAllReviews = async () => {
  await Review.deleteMany({})
}
