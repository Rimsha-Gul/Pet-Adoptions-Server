import { Request } from 'express'
import multer, { FileFilterCallback, Options } from 'multer'
import path from 'path'

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    // Specify the directory where you want to store the uploaded images
    callback(null, 'uploads/')
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void
  ) => {
    // Extract the original filename from the uploaded file
    const originalFilename = file.originalname

    // Remove the file extension
    const filenameWithoutExtension = path.parse(originalFilename).name

    // Generate a unique filename for the uploaded image
    const currentDate = new Date()

    const month = currentDate.getMonth() + 1 // Adding 1 since getMonth() returns zero-based month (0 for January)
    const date = currentDate.getDate()
    const year = currentDate.getFullYear()

    const formattedDate = `${month}-${date}-${year}`
    const uniqueSuffix = formattedDate + '-' + Math.round(Math.random() * 1e9)
    callback(null, filenameWithoutExtension + '-' + uniqueSuffix)
  }
})

const fileFilter: Options['fileFilter'] = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  // Check if the file type is an image
  if (file.mimetype.startsWith('image/')) {
    callback(null, true) // Accept the file
  } else {
    callback(new Error('Only image files are allowed.')) // Reject the file
  }
}

const options: Options = { storage, fileFilter }

// Create a Multer instance with the storage configuration
const upload = multer(options)

export default upload
