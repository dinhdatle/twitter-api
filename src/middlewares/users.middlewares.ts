import e, { Request, Response, NextFunction } from 'express'
import { ParamSchema, check, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  notEmpty: { errorMessage: userMessages.PASSWORD_IS_REQUIRED },
  isString: { errorMessage: userMessages.PASSWORD_MUST_BE_STRING },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minSymbols: 1
    },
    errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
  },
  errorMessage:
    'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 symbol'
}
const confirmPasswordSchema: ParamSchema = {
  notEmpty: { errorMessage: userMessages.CONFIRM_PASSWORD_IS_REQUIRED },
  isString: { errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRING },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: userMessages.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minSymbols: 1
    },
    errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    // IF PASSWORD DOES NOT MATCH CONFIRM PASSWORD THROW AN ERROR
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(userMessages.CONFIRM_PASSWORD_IS_NOT_EQUAL_TO_PASSWORD)
      }
      return true
    }
  }
}

export const loginValidator = validate(
  checkSchema({
    email: {
      notEmpty: { errorMessage: userMessages.EMAIL_IS_REQUIRED },
      isEmail: { errorMessage: userMessages.EMAIL_IS_INVALID },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) })
          if (!user) {
            throw new Error(userMessages.EMAIL_OR_PASSWORD_IS_INCORRECT)
          }
          req.user = user
          return true
        }
      }
    },
    password: {
      notEmpty: { errorMessage: userMessages.PASSWORD_IS_REQUIRED },
      isString: { errorMessage: userMessages.PASSWORD_MUST_BE_STRING },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minSymbols: 1
        },
        errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 symbol'
    }
  })
)

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: userMessages.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: userMessages.NAME_MUST_BE_STRING
      },
      isLength: {
        options: {
          min: 1,
          max: 100
        },
        errorMessage: userMessages.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      },
      trim: true
    },
    email: {
      notEmpty: { errorMessage: userMessages.EMAIL_IS_REQUIRED },
      isEmail: { errorMessage: userMessages.EMAIL_IS_INVALID },
      trim: true,
      custom: {
        options: async (value) => {
          const result = await usersService.checkEmailExist(value)
          if (result) {
            throw new Error(userMessages.EMAIL_ALREADY_EXISTS)
            // throw new ErrorWithStatus({ message: 'Email already exists', status: 401})
          }
        }
      }
    },
    password: {
      notEmpty: { errorMessage: userMessages.PASSWORD_IS_REQUIRED },
      isString: { errorMessage: userMessages.PASSWORD_MUST_BE_STRING },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minSymbols: 1
        },
        errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 symbol'
    },
    confirm_password: {
      notEmpty: { errorMessage: userMessages.CONFIRM_PASSWORD_IS_REQUIRED },
      isString: { errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRING },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: userMessages.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minSymbols: 1
        },
        errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        // IF PASSWORD DOES NOT MATCH CONFIRM PASSWORD THROW AN ERROR
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(userMessages.CONFIRM_PASSWORD_IS_NOT_EQUAL_TO_PASSWORD)
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        },
        errorMessage: userMessages.DATE_MUST_BE_ISO_8601
      }
    }
  })
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: { errorMessage: userMessages.ACCESS_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = (value || '').split(' ')[1]

            if (!accessToken) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            try {
              const decoded_authorization = await verifyToken({
                token: accessToken,
                secretKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refeshTokens.findOne({ token: value })
              ])
              // const decoded_refesh_token = await verifyToken({ token: value })
              // await databaseService.refeshTokens.findOne({token: value })
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: userMessages.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              req.decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: userMessages.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              req.decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: { errorMessage: userMessages.EMAIL_IS_REQUIRED },
        isEmail: { errorMessage: userMessages.EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            if (!user) {
              throw new Error(userMessages.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretKey: process.env.JWT_FORGOT_PASSWORD_TOKEN as string
              })
              const { user_id } = decoded_forgot_password_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

              if (user === null) {
                throw new ErrorWithStatus({
                  message: userMessages.USER_NOT_FOUND,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: userMessages.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretKey: process.env.JWT_FORGOT_PASSWORD_TOKEN as string
              })
              const { user_id } = decoded_forgot_password_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

              if (user === null) {
                throw new ErrorWithStatus({
                  message: userMessages.USER_NOT_FOUND,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: userMessages.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              req.decoded_forgot_password_token = decoded_forgot_password_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      message: userMessages.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        notEmpty: {
          errorMessage: userMessages.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: userMessages.NAME_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: userMessages.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        },
        trim: true
      },
      date_of_birth: {
        optional: true,
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: userMessages.DATE_MUST_BE_ISO_8601
        }
      },
      bio: {
        optional: true,
        isString: { errorMessage: userMessages.BIO_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: userMessages.BIO_LENGTH_MUST_BE_FROM_1_TO_200
        }
      },
      location: {
        optional: true,
        isString: { errorMessage: userMessages.LOCATION_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: userMessages.LOCATION_LENGTH_MUST_BE_FROM_1_TO_200
        }
      },
      website: {
        optional: true,
        isURL: { errorMessage: userMessages.WEBSITE_MUST_BE_URL },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: userMessages.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_200
        }
      },
      username: {
        optional: true,
        isString: { errorMessage: userMessages.USERNAME_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const REGEX = /^(?![0-9]+$)[A-Za-z0-9_]{4,15}$/
            if (!REGEX.test(value)) {
              throw new Error(userMessages.USERNAME_INVALID)
            }
            const user = await databaseService.users.findOne({ username: value })
            // ton tai username trong db
            if (user) {
              throw Error('USERNAME EXITST')
            }
          }
        }
      },
      avatar: {
        optional: true,
        isString: { errorMessage: userMessages.IMAGE_URL_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 400
          },
          errorMessage: userMessages.IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400
        }
      },
      cover_photo: {
        optional: true,
        isString: { errorMessage: userMessages.IMAGE_URL_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 400
          },
          errorMessage: userMessages.IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400
        }
      }
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema({
    followed_user_id: {
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              message: userMessages.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          const followed_user = await databaseService.users.findOne({
            _id: new ObjectId(value)
          })

          if (followed_user === null) {
            throw new ErrorWithStatus({
              message: userMessages.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }
        }
      }
    }
  })
)

export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value: string, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: userMessages.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            const followed_user = await databaseService.users.findOne({
              _id: new ObjectId(value)
            })

            if (followed_user === null) {
              throw new ErrorWithStatus({
                message: userMessages.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
          }
        }
      }
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = req.decoded_authorization
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            if (user === null) {
              throw new ErrorWithStatus({
                message: userMessages.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            const { password } = user
            const isMatch = hashPassword(value) === password
            if (!isMatch) {
              throw new ErrorWithStatus({ message: 'OLD PASSWORD NOT MATCH', status: HTTP_STATUS.UNAUTHORIZED })
            }
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)
