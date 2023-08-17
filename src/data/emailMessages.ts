export const getVerificationCodeEmail = (verificationCode: string) => {
  const subject = 'Purrfect Adoptions - Email Verification'
  const message = `<p>Your email verification code is: <strong>${verificationCode}</strong>.</p><p>Do not share this code with anyone else.</p>`

  return {
    subject,
    message
  }
}

export const getResetPasswordEmail = (resetToken: string) => {
  const subject = 'Purrfect Adoptions - Password Reset Request'

  const message = `
    <p>We received a request to reset your password. The password reset window is limited to one hour.</p>
    <p>If you do not reset your password within one hour, you will need to submit a new request.</p>
    <p>Please click on the following link to complete the process:</p>
     <p><a href="http://127.0.0.1:5173/resetPassword/${resetToken}/">Reset</a></p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `

  return {
    subject,
    message
  }
}

export const getHomeVisitRequestEmail = (applicationID: string) => {
  const subject = 'Purrfect Adoptions - Home Visit Request'
  const nextWeekDate = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString()

  const message = `
    <p>Dear Applicant,</p>
    <p>Your application for adoption, ID: <strong>${applicationID}</strong>, has reached the stage where a home visit is required.</p>
    <p>As part of our process, we ask that you schedule this visit within the next week, by <strong>${nextWeekDate}</strong>. This visit is an important step in ensuring that the pet will be comfortable and secure in their potential new home.</p>
    <p>Please click <a href="http://127.0.0.1:5173/${applicationID}/scheduleHomeVisit">here</a> to schedule your home visit.</p>
    <p>If you have any questions or require any assistance, please feel free to respond to this email.</p>
    <p>Thank you for your cooperation and your interest in adopting.</p>
    <p>Best,</p>
    <p>The Purrfect Adoptions Team</p>
  `

  return {
    subject,
    message
  }
}

export const getApplicantHomeVisitScheduledEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Home Visit Scheduled'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We are happy to inform you that your home visit for your application, ID: <strong>${applicationID}</strong>, has been successfully scheduled.</p>
    <p>The visit is set for: <strong>${formattedDate}</strong></p>
    <p>Please ensure that you are available at the scheduled time. During the visit, we will assess the living conditions and ensure it is a safe and loving environment for our pets.</p>
    <p>If the visit is successful, we will then move on to the next step of the adoption process.</p>
    <p>Thank you for choosing Purrfect Adoptions!</p>
  `

  return {
    subject,
    message
  }
}

export const getShelterHomeVisitScheduledEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Home Visit Scheduled'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>A home visit for application ID: <strong>${applicationID}</strong> has been scheduled.</p>
    <p>The visit is set for: <strong>${formattedDate}</strong></p>
    <p>Please ensure that a representative is available to conduct the visit. During the visit, please assess the living conditions to ensure they are appropriate for the specific pet applied for. </p>
    <p>Ensure to document any significant findings for review in the application process.</p>
    <p>Thank you for your hard work!</p>
  `

  return {
    subject,
    message
  }
}

export const getHomeApprovalEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Home Approved'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We are thrilled to inform you that your home visit for your application, ID: <strong>${applicationID}</strong>, has been successful.</p>
    <p>The approval was confirmed on: <strong>${formattedDate}</strong></p>
    <p>The next step of the adoption process will be your scheduled visit to our shelter. We will be in touch soon with scheduling details.</p>
    <p>Thank you for your cooperation and patience during this process. We appreciate your commitment to providing a loving home for our pets.</p>
  `

  return {
    subject,
    message
  }
}

export const getHomeRejectionEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Home Visit Unsuccessful'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We regret to inform you that your home visit for your application, ID: <strong>${applicationID}</strong>, has not been successful.</p>
    <p>The decision was confirmed on: <strong>${formattedDate}</strong></p>
    <p>We understand this may be disappointing, and we want to assure you that this decision does not reflect upon you personally. Our primary concern is the well-being of our pets, and sometimes this means making difficult decisions.</p>
    <p>If you believe there have been changes to your living situation that may influence this decision, please feel free to reapply.</p>
    <p>Thank you for your understanding and your interest in providing a loving home for our pets.</p>
  `

  return {
    subject,
    message
  }
}

export const getApplicantShelterVisitScheduledEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Shelter Visit Scheduled'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We are pleased to inform you that your shelter visit for your application, ID: <strong>${applicationID}</strong>, has been successfully scheduled.</p>
    <p>The visit is set for: <strong>${formattedDate}</strong></p>
    <p>Please ensure that you are available at the scheduled time. During your visit, you will have the opportunity to meet the pet and assess if it's a good fit for you.</p>
    <p>If the visit is successful, we will then move on to the next step of the adoption process.</p>
    <p>Thank you for choosing Purrfect Adoptions!</p>
  `

  return {
    subject,
    message
  }
}

export const getShelterShelterVisitScheduledEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Shelter Visit Scheduled'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>A shelter visit for application ID: <strong>${applicationID}</strong> has been scheduled.</p>
    <p>The visit is set for: <strong>${formattedDate}</strong></p>
    <p>Please ensure that a representative and the pet are available for the visit. During the visit, observe the interaction between the applicant and the pet to assess their compatibility.</p>
    <p>Ensure to document any significant findings for review in the application process.</p>
    <p>Thank you for your dedication and hard work!</p>
  `

  return {
    subject,
    message
  }
}

export const getApplicantAdoptionConfirmationEmail = (
  applicationID: string,
  adoptionDate: string
) => {
  const subject = 'Purrfect Adoptions - Adoption Successful'
  const formattedDate = new Date(adoptionDate).toLocaleString()

  const message = `
    <p>Congratulations! We are pleased to inform you that your application, ID: <strong>${applicationID}</strong>, has resulted in a successful adoption.</p>
    <p>The adoption was confirmed on: <strong>${formattedDate}</strong></p>
    <p>We are thrilled to see another pet find a loving home and wish you all the best on this new journey. Don't hesitate to reach out if you have any queries or need support.</p>
    <p>Thank you for your commitment to animal adoption and for being a part of the Purrfect Adoptions community.</p>
  `

  return {
    subject,
    message
  }
}

export const getShelterAdoptionConfirmationEmail = (
  applicationID: string,
  adoptionDate: string,
  applicantEmail: string
) => {
  const subject = 'Purrfect Adoptions - Adoption Finalized'
  const formattedDate = new Date(adoptionDate).toLocaleString()

  const message = `
    <p>We're delighted to inform you that the adoption for the application, ID: <strong>${applicationID}</strong>, by applicant: <strong>${applicantEmail}</strong> has been successfully completed.</p>
    <p>The adoption was confirmed on: <strong>${formattedDate}</strong></p>
    <p>This marks another successful pet adoption from your shelter, contributing towards our mission of finding homes for all animals in need.</p>
    <p>Thank you for your continuous dedication and care towards the animals. Your efforts make a significant difference.</p>
  `

  return {
    subject,
    message
  }
}

export const getApplicantAdoptionRejectionEmail = (
  applicationID: string,
  rejectionDate: string
) => {
  const subject = 'Purrfect Adoptions - Adoption Not Successful'
  const formattedDate = new Date(rejectionDate).toLocaleString()

  const message = `
    <p>We regret to inform you that your application, ID: <strong>${applicationID}</strong>, did not result in an adoption.</p>
    <p>The decision was made on: <strong>${formattedDate}</strong></p>
    <p>We understand that not every visit or interaction leads to an adoption, and we encourage you to continue searching for the right pet. Our team is available to assist you in this journey.</p>
    <p>Thank you for considering adoption and for being a part of the Purrfect Adoptions community.</p>
  `

  return {
    subject,
    message
  }
}

export const getShelterAdoptionRejectionEmail = (
  applicationID: string,
  rejectionDate: string,
  applicantEmail: string
) => {
  const subject = 'Purrfect Adoptions - Adoption Not Finalized'
  const formattedDate = new Date(rejectionDate).toLocaleString()

  const message = `
    <p>We regret to inform you that the potential adoption for the application, ID: <strong>${applicationID}</strong>, by applicant: <strong>${applicantEmail}</strong> did not proceed.</p>
    <p>The decision was made on: <strong>${formattedDate}</strong></p>
    <p>We understand that not every visit or interaction leads to an adoption, and we are committed to ensuring the best fit for each pet. Your pet will be available again for other potential adopters.</p>
    <p>Thank you for your continuous dedication and care towards the animals. Your efforts make a significant difference.</p>
  `

  return {
    subject,
    message
  }
}

export const getShelterInvitationEmail = (invitationLink: string) => {
  const subject = 'Purrfect Adoptions - Invitation to Join Our Network'

  const message = `
    <p>Greetings,</p>
    <p>We are thrilled to extend an invitation to join our growing network of dedicated shelters on Purrfect Adoptions.</p>
    <p>We have built a platform that brings together shelters and potential pet adopters, with a mission to find loving and suitable homes for as many pets as possible.</p>
    <p>To accept this invitation and begin the registration process, please click <a href="http://127.0.0.1:5173/shelter/invitation/${invitationLink}/">here</a></p>
    <p>Please note that this invitation is valid for one week. If the invitation has expired, please contact us to receive a new one.</p>
    <p>If you have any questions or need further assistance, please do not hesitate to reply to this email. We look forward to partnering with you in our endeavor to make a positive impact on the lives of pets and adopters alike.</p>
    <p>Thank you,</p>
    <p>The Purrfect Adoptions Team</p>
  `

  return {
    subject,
    message
  }
}
export const getPetAdoptionNotificationEmail = (applicationID: string) => {
  const subject = 'Purrfect Adoptions - Pet Adoption Update'

  const message = `
    <p>Dear applicant,</p>
    <p>We hope this message finds you well. We are reaching out to inform you that the pet you applied for, application ID: <strong>${applicationID}</strong>, has found a new home.</p>
    <p>We understand that you may be disappointed, and we appreciate your understanding. There are many other pets in need of a loving home, and we encourage you to consider applying for another pet.</p>
    <p>Thank you for your interest in providing a home for our pets. Your compassion makes a huge difference in their lives.</p>
  `

  return {
    subject,
    message
  }
}
