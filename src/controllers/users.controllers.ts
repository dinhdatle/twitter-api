import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { pick } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import {
  FollowReqBody,
  ForgotPasswordReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  TokenPayload,
  UpdateMeReqBody,
  unfollowReqParams
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schemas'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  return res.json({ message: userMessages.LOGIN_SUCCESS, result })
}

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await usersService.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&newUser=${result.newUser}`
  return res.redirect(urlRedirect)
  // return res.json({
  //   message: result.newUser ? userMessages.REGISTER_SUCCESS : userMessages.LOGIN_SUCCESS,
  //   result :
  // })
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

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload
  const { refresh_token } = req.body
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp })
  return res.json({
    message: userMessages.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}

export const emailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'User not found' })
  }

  if (user.email_verify_token === '') {
    return res.json({ message: userMessages.EMAIL_ALREADY_VERIFIED_BEFORE })
  }

  const result = await usersService.verifyEmail(user_id)
  return res.json({ message: userMessages.EMAIL_VERIFY_SUCCESS, result })
}

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({ message: userMessages.EMAIL_ALREADY_VERIFIED_BEFORE })
  }
  const result = await usersService.resendVerifyEmail(user_id, user.email)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, verify, email } = req.user as User
  const result = await usersService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify: verify, email })
  return res.json(result)
}

export const verifyForgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  return res.json({ message: userMessages.VERIFY_FORGOT_PASSWORD_SUCCESS })
}

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersService.resetPassword(user_id, password)
  res.json(result)
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getMe(user_id)
  return res.json({ message: userMessages.GET_ME_SUCCESS, result: user })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const body = req.body
  const result = await usersService.updateMe(user_id, body)
  return res.json({ message: userMessages.UPDATE_ME_SUCCESS, result })
}

export const getProfileController = async (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.params
  console.log(username)
  const user = await usersService.getProfile(username)
  return res.json({ message: userMessages.GET_PROFILE_SUCCESS, result: user })
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await usersService.follow(user_id, followed_user_id as string)
  return res.json({ result })
}

export const unfollowController = async (
  req: Request<ParamsDictionary, any, unfollowReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersService.unfollow(user_id, followed_user_id as string)
  return res.json({ result })
}

export const changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  return res.json({ result })
}
