import { Role } from '../models/User'

export const shelterProfileResponseExample = {
  profilePhoto: 'https://example.com/shelterProfilePhoto.jpg',
  name: 'Animal Haven Shelter',
  email: 'info@animalhavenshelter.com',
  address: '251 Centre St, New York, NY 10013, USA',
  bio: 'Animal Haven is a non-profit organization that finds homes for abandoned cats and dogs throughout the Tri-State area, and provides behavior intervention when needed to improve chances of adoption. Founded in 1967, we operate an animal shelter in Manhattan. We also provide programs that enhance the bond between animals and people.',
  rating: 4.8,
  numberOfReviews: 567,
  canReview: true
}

export const verifyInvitationResponseExample = {
  email: 'info@animalhavenshelter.com',
  role: Role.Shelter
}
