import transporter from '../plugins/nodemailer.plugin'

export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  message: string
): Promise<void> => {
  const mailOptions = {
    from: '"Purrfect Adoptions" <' + process.env.NODEMAILER_USER + '>',
    to: `${recipientEmail}`,
    subject: `${subject}`,
    html: `${message}`
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
