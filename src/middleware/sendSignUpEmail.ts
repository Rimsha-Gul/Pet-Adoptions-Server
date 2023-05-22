import transporter from '../plugins/nodemailer.plugin'

export const sendSignupEmail = async (
  verificationCode: string,
  recipientEmail: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: `${recipientEmail}`,
    subject: 'Purrfect Adoptions - Email Verification',
    text: `Your email verification code is: ${verificationCode}. Do not share this code with anyone else.`
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Signup email sent: ' + info)
  } catch (error) {
    console.error('Error sending signup email:', error)
  }
}
