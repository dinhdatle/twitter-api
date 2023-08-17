import { Request } from 'express'
import User from './models/schemas/User.schemas'

declare module 'express' {
  interface Request {
    user?: User
    decoded_email_verify_token?: TokenPayload
    decoded_authorization?: TokenPayload
  }
}
