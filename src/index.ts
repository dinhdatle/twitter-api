import express, { NextFunction, Request, Response } from 'express'
import usersRouter from './routes/users.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRouter from './routes/static.routes'
import databaseService from './services/database.services'
import tweetRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import likesRouter from './routes/likes.routes'

config()
const app = express()
const port = process.env.PORT || 4000
app.use(express.json())
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexFollowers()
})

// Kiem tra xem co file uploads
initFolder()

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/tweets', tweetRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likesRouter)


// app.use('/static/image', express.static(UPLOAD_IMAGE_DIR))
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use('/static', staticRouter)

app.use(defaultErrorHandler)
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.log('Loi la', err.message)
//   res.status(400).json({ error: err.message })
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
