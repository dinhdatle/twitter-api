import { Router } from 'express'
import {
  createTweetController,
  getNewFeedControler,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controller'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  panigationValidor,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares'

import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const tweetRouter = Router()

tweetRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

// Get tweet children
// query { limit: number, page: number, tweet_type: number}
tweetRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  getTweetChildrenValidator,
  panigationValidor,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

// Get new feed
// query { limit: number, page: number}
tweetRouter.get(
  '/',
  panigationValidor,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedControler)
)

export default tweetRouter
