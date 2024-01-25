import path from 'path'
import { drive, getOrCreateFolder } from '../middleware/uploadFiles'
import { UserRequest } from '../types/Request'
import { RequestUser } from '../types/RequestUser'
import { Readable } from 'stream'

export const uploadFiles = async (
  files: Express.Multer.File[] | Express.Multer.File,
  req: UserRequest
): Promise<string[]> => {
  if (process.env.NODE_ENV === 'cypress_test') {
    return ['mock-file-id-123']
  }

  const fileArray = Array.isArray(files) ? files : [files]
  const fileIds: string[] = []

  for (const file of fileArray) {
    const shelterID = req.body.shelterID
      ? req.body.shelterID
      : (req.user as RequestUser)._id

    const shelterIDFolderId = await getOrCreateFolder(
      drive,
      shelterID.toString(),
      process.env.DRIVE_PARENT_FOLDER_ID || ''
    )

    const originalFilename = file.originalname
    const filenameWithoutExtension = path.parse(originalFilename).name
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const date = currentDate.getDate()
    const year = currentDate.getFullYear()
    const formattedDate = `${month}-${date}-${year}`
    const uniqueSuffix = formattedDate + '-' + Math.round(Math.random() * 1e9)
    const filename =
      filenameWithoutExtension +
      (req.body.microchipID ? '-' + req.body.microchipID : '') +
      '-' +
      uniqueSuffix

    const fileMetadata = {
      name: filename,
      parents: [shelterIDFolderId]
    }

    const readableStream = new Readable()
    readableStream.push(file.buffer)
    readableStream.push(null) // Indicates the end of stream

    const media = {
      mimeType: file.mimetype,
      body: readableStream
    }

    try {
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
      })

      if (response.data.id) {
        fileIds.push(response.data.id)
      } else {
        throw {
          code: 500,
          message: 'Failed to get the file ID from Google Drive.'
        }
      }
    } catch (err) {
      throw { code: 500, message: err.message }
    }
  }

  return fileIds
}
