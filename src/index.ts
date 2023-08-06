import express, { NextFunction, Request, Response } from 'express'
import usersRouter from './routes/users.routes'
import databaeService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'

const app = express()
const port = 3000
app.use(express.json())
databaeService.connect()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/users', usersRouter)
app.use(defaultErrorHandler)
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.log('Loi la', err.message)
//   res.status(400).json({ error: err.message })
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
