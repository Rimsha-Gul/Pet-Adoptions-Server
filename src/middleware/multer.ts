import { Request } from 'express'
import multer, { FileFilterCallback, Options } from 'multer'
import fs from 'fs'
import { google, drive_v3 } from 'googleapis'

// let serviceAccountCredentials
// if (process.env.GOOGLE_SERVICE_ACCOUNT) {
//   serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
// } else {
//   console.error('Environment variable GOOGLE_SERVICE_ACCOUNT is not defined')
//   process.exit(1)
// }

// const auth = new google.auth.GoogleAuth({
//   credentials: serviceAccountCredentials,
//   scopes: ['https://www.googleapis.com/auth/drive.file']
// })

let serviceAccountCredentials
try {
  // Load the service account credentials from a file
  serviceAccountCredentials = JSON.parse(
    fs.readFileSync('purrfectadoptions-46c9b20cb8c0.json', 'utf8')
  )
} catch (error) {
  console.error('Failed to load service account credentials:', error)
  process.exit(1)
}

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountCredentials,
  scopes: ['https://www.googleapis.com/auth/drive.file']
})

const drive = google.drive({ version: 'v3', auth })

async function getOrCreateFolder(
  drive: drive_v3.Drive,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  // Search for the folder in the parent folder
  const response = await drive.files.list({
    q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
    fields: 'files(id, name)'
  })

  if (response.data.files && response.data.files.length > 0) {
    // The folder exists, check if ID is defined and return it
    const id = response.data.files[0].id
    if (typeof id === 'string') {
      return id
    } else {
      throw new Error('File ID is not defined.')
    }
  } else {
    // The folder doesn't exist, create it
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    }

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id'
    })

    // If the file creation wasn't successful, throw an error
    if (!file.data.id) {
      throw new Error('Failed to create folder on Google Drive')
    }

    // Return the ID of the created folder
    return file.data.id
  }
}

const storage = multer.memoryStorage()

const fileFilter: Options['fileFilter'] = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true) // Accept the file
  } else {
    callback(new Error('Only image files are allowed.')) // Reject the file
  }
}

const options: Options = { storage, fileFilter }

const upload = multer(options)

export { drive, getOrCreateFolder }
export default upload
