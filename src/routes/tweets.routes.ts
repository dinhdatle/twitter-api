import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const tweetRouter = Router()

tweetRouter.post('/',accessTokenValidator,verifiedUserValidator,wrapRequestHandler(createTweetController))


export default tweetRouter

