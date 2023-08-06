import express from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validations.run(req)
    const errors = validationResult(req)
    // KHONG CO LOI THI NEXT TIEP TUC REQUEST
    if (errors.isEmpty()) {
      return next()
    }

    const entityError = new EntityError({ errors: {} })
    const errorsObject = errors.mapped()
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      // if (msg.msg instanceof ErrorWithStatus && msg.msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
      //   return next(msg.msg)
      // }
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityError.errors[key] = msg
    }

    // res.status(422).json({ errors: errors.mapped() })
    next(entityError)
  }
}
