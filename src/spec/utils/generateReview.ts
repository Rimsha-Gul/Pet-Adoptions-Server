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
