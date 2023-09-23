import { Request } from 'express'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/other'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
config()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await uploadFileToS3({
          filename: 'images/' + `${newName}.jpg`,
          filepath: newPath,
          contentType: mime.getType(newPath) as string
        })
        fs.unlinkSync(file.filepath)
        fs.unlinkSync(newPath)

        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/${newName}.jpg`
        //     : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
        //   type: MediaType.Image
        // }

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const s3Result = await uploadFileToS3({
          filename: 'videos/' + file.newFilename,
          contentType: mime.getType(file.filepath) as string,
          filepath: file.filepath
        })
        fs.unlinkSync(file.filepath)
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Video
        }
      })
    )
    // const { newFilename } = files[0]
    // return {
    //   url: isProduction
    //     ? `${process.env.HOST}/static/video/${newFilename}`
    //     : `http://localhost:${process.env.PORT}/static/video/${newFilename}`,
    //   type: MediaType.Video
    // }
    return result
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        encodeHLSWithMultipleVideoStreams(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video/${file.newFilename}`
            : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
          type: MediaType.Video
        }
      })
    )
  }
}
const mediasService = new MediasService()
export default mediasService
