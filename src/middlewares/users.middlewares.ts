import e, { Request, Response, NextFunction } from 'express'
import { check, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import HTTP_STATUS from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

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
            const accessToken = value.split(' ')[1]

            if (!accessToken) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            try {
              const decoded_authorization = await verifyToken({ token: accessToken })
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
        notEmpty: { errorMessage: userMessages.REQUEST_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const [decoded_refresh_token,refresh_token] = await Promise.all([verifyToken({ token: value }),databaseService.refeshTokens.findOne({token: value })])
              // const decoded_refesh_token = await verifyToken({ token: value })
              // await databaseService.refeshTokens.findOne({token: value })
              if(refresh_token === null){
                throw new ErrorWithStatus({
                  message: userMessages.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              req.decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if(error instanceof JsonWebTokenError){
                throw new ErrorWithStatus({
                  message: userMessages.REFRESH_TOKEN_IS_INVALID,
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