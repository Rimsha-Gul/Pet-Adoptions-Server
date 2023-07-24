export const getVerificationCodeEmail = (verificationCode: string) => {
  const subject = 'Purrfect Adoptions - Email Verification'
  const message = `<p>Your email verification code is: <strong>${verificationCode}</strong>.</p><p>Do not share this code with anyone else.</p>`

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

export const getShelterApprovalEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Shelter Approved'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>Congratulations! We're delighted to inform you that your visit to the shelter for your application, ID: <strong>${applicationID}</strong>, has been successful.</p>
    <p>You confirmed the approval on: <strong>${formattedDate}</strong></p>
    <p>This concludes the adoption process and we're excited to welcome you to our community of pet parents. You can now proceed to take your new pet home!</p>
    <p>Thank you for choosing to adopt and providing a loving home for our pets. We trust your new pet will bring much joy and happiness to your home.</p>
  `

  return {
    subject,
    message
  }
}

export const getUserApprovalToShelterEmail = (
  applicationID: string,
  visitDate: string,
  applicantEmail: string
) => {
  const subject = 'Purrfect Adoptions - User Approved Shelter'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We are delighted to inform you that the applicant with email: <strong>${applicantEmail}</strong> and application ID: <strong>${applicationID}</strong>, has approved the shelter after the visit.</p>
    <p>The approval was confirmed on: <strong>${formattedDate}</strong></p>
    <p>This marks the successful conclusion of the adoption process. The applicant can now proceed to take the pet home. Please prepare for the pet's transition.</p>
    <p>Thank you for your commitment to ensuring our pets find loving homes. Your efforts have resulted in another successful adoption.</p>
  `

  return {
    subject,
    message
  }
}

export const getShelterRejectionEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Shelter Visit Unsuccessful'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We regret to learn that your visit to our shelter for your application, ID: <strong>${applicationID}</strong>, did not meet your expectations.</p>
    <p>You confirmed the decision on: <strong>${formattedDate}</strong></p>
    <p>While we understand that this decision may be disappointing for us, we respect your judgement. Our primary concern is the well-being of our pets, and it's important that they find a home that is a good fit.</p>
    <p>If circumstances change in the future or you wish to consider other pets, we welcome you to apply again.</p>
    <p>Thank you for your interest in adopting and considering providing a loving home for our pets.</p>
  `

  return {
    subject,
    message
  }
}

export const getUserRejectionToShelterEmail = (
  applicationID: string,
  visitDate: string,
  applicantEmail: string
) => {
  const subject = 'Purrfect Adoptions - User Rejected Shelter'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We regret to inform you that the applicant with email: <strong>${applicantEmail}</strong> and application ID: <strong>${applicationID}</strong>, did not approve the shelter after the visit.</p>
    <p>The decision was confirmed on: <strong>${formattedDate}</strong></p>
    <p>While this is an unfortunate outcome, we respect the applicant's decision. We believe it's vital that our pets find the most suitable homes where they will thrive.</p>
    <p>We appreciate your understanding and your commitment to our cause. We trust that the right home will soon be found for our pet.</p>
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
    <p>To accept this invitation and begin the registration process, please click on the following link: <a href="http://127.0.0.1:5173/shelter/invitation/${invitationLink}/">here</a>
    <p>If you have any questions or need further assistance, please do not hesitate to reply to this email. We look forward to partnering with you in our endeavor to make a positive impact on the lives of pets and adopters alike.</p>
    <p>Thank you,</p>
    <p>The Purrfect Adoptions Team</p>
  `

  return {
    subject,
    message
  }
}
