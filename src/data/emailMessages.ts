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

export const getHomeVisitScheduledEmail = (
  applicationID: string,
  visitDate: string
) => {
  const subject = 'Purrfect Adoptions - Home Visit Scheduled'
  const formattedDate = new Date(visitDate).toLocaleString()

  const message = `
    <p>We are happy to inform you that your home visit for your application, ID: <strong>${applicationID}</strong>, has been successfully scheduled.</p>
    <p>The visit is set for: <strong>${formattedDate}</strong></p>
    <p>Please ensure that you are available at the scheduled time.</p>
    <p>Thank you for choosing Purrfect Adoptions!</p>
  `

  return {
    subject,
    message
  }
}
