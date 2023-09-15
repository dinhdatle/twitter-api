import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LIKES_MESSAGES } from '~/constants/messages'
import { LikeTweetReqBody } from '~/models/requests/Like.request'
import { TokenPayload } from '~/models/requests/User.requests'
import likessService from '~/services/like.services'

export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeTweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await likessService.likeTweet(user_id, req.body.tweet_id)
  return res.json({
    message: LIKES_MESSAGES.LIKE_SUCCESS,
    result
  })
}

export const unlikeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await likessService.unlikeTweet(user_id, req.params.tweet_id)
  return res.json({
    message: LIKES_MESSAGES.UNLIKE_SUCCESS,
    result
  })
}
