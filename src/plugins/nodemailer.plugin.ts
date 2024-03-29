import nodemailer from 'nodemailer'

/***********************************
 *     Nodemailer Initialization   *
 ***********************************/

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  }
})
export default transporter
