import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { userMessages } from '~/constants/messages'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schemas'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())
  return res.json({ message: userMessages.LOGIN_SUCCESS, result })
}
// export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  // try {
  //   const result = await usersService.register(req.body)
  //   return res.json({ message: 'Register success', result })
  // } catch (error) {
  //   return res.status(400).json({ error: 'Register failed' })
  // }
  const result = await usersService.register(req.body)
  return res.json({ message: 'Register success', result })
}

export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}