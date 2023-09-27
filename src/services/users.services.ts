import User from '~/models/schemas/User.schemas'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { userMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'
import axios from 'axios'
import { sendForgotPasswordEmailTemplate, sendVerifyEmailTemplate } from '~/utils/email'

class UsersService {
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({ token: refresh_token, secretKey: process.env.JWT_SECRET_REFRESH_TOKEN as string })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refeshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )

    // Server send email to user
    // user click link in emai
    // Clienr send request to server with email verify token
    // server verify email verify token
    // client receive access token and refesh token
    // console.log('email_verify_token', email_verify_token)

    // await sendVerifyEmailTemplate(payload.email, email_verify_token)

    return { access_token, refresh_token }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refeshTokens.deleteOne({ token: refresh_token })
    ])
    const { iat } = await this.decodeRefreshToken(new_refresh_token) // exp trung voi token cu nen khong can lay

    await databaseService.refeshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token, iat, exp })
    )
    return { access_token: new_access_token, refresh_token: new_refresh_token }
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refeshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return { access_token, refresh_token }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data as { access_token: string; id_token: string }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: { access_token, alt: 'json' },
      headers: { Authorization: `Bearer ${id_token}` }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({ message: userMessages.GMAIL_NOT_VERIFIED, status: HTTP_STATUS.BAD_REQUEST })
    }
    // KIEM TRA EMAIL DA DANG KI HAY CHUA ?
    const user = await databaseService.users.findOne({ email: userInfo.email })
    //  neu ton tai thi login khong co thi tao moi
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: UserVerifyStatus.Verified
      })
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)

      await databaseService.refeshTokens.insertOne(
        new RefreshToken({ user_id: user._id, token: refresh_token, iat, exp })
      )
      return { access_token, refresh_token, newUser: false }
    } else {
      const randomPassword = Math.random().toString(36).substring(2, 10)
      const data = await this.register({
        name: userInfo.name,
        email: userInfo.email,
        password: randomPassword,
        confirm_password: randomPassword,
        date_of_birth: new Date().toISOString()
      })
      return { ...data, newUser: false }
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refeshTokens.deleteOne({ token: refresh_token })
    return { message: userMessages.LOGOUT_SUCCESS }
  }

  async verifyEmail(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Verified
    })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token: '', updated_at: new Date(), verify: UserVerifyStatus.Verified } }
    )
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refeshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return { access_token, refresh_token }
  }

  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // console.log('resen_verify_token', email_verify_token)
    await sendVerifyEmailTemplate(email, email_verify_token)
    // cap nhap lai gia tri email_verify_token
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token, updated_at: new Date() } }
    )
    return { message: userMessages.RESEND_VERIFY_EMAIL_SUCCESS }
  }

  async forgotPassword({ user_id, verify, email }: { user_id: string; verify: UserVerifyStatus; email: string }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      { $set: { forgot_password_token, updated_at: '$$NOW' } }
    ])

    // SEND EMAIL WITH LINK TO EMAIL USER : localhost:3000/reset-password?token=token
    // console.log('forgot_password_token', forgot_password_token)
    await sendForgotPasswordEmailTemplate(email, forgot_password_token)
    return { message: userMessages.CHECK_EMAIL_TO_RESET_PASSWORD }
  }

  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { password: hashPassword(password), forgot_password_token: '', updated_at: new Date() } }
    )
    return { message: userMessages.RESET_PASSWORD_SUCCESS }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )

    if (user === null) {
      throw new ErrorWithStatus({
        message: userMessages.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async updateMe(user_id: string, payload: any) {
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      { $set: { ...payload }, $currentDate: { updated_at: true } },
      { returnDocument: 'after' }
    )
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.follower.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follower === null) {
      await databaseService.follower.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        message: 'FOLLOW SUCCESS'
      }
    }

    return {
      message: 'FOLLOWED'
    }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.follower.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    //  chua follow thi hien thong bao chua follow
    if (follower === null) {
      return {
        message: 'ALREADY UNFOLLOW'
      }
    }
    //  tim thay da follow thi tien hang xoa document follow
    await databaseService.follower.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: 'UNFOLLOW SUCCESS'
    }
  }

  async changePassword(user_id: string, new_password: string) {
    const user = await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { password: hashPassword(new_password) }, $currentDate: { updated_at: true } }
    )
    return { message: 'CHANGE PASSWORD SUCCESS' }
  }
}

const usersService = new UsersService()
export default usersService
