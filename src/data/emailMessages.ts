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
  const message = `<p>Your application for adoption has reached the stage where a home visit is required. Please click <a href="http://127.0.0.1:5173/${applicationID}/scheduleHomeVisit">here</a> to schedule a home visit.</p><p>Thank you for your cooperation!</p>`

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
