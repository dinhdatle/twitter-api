import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARKS_MESSAGES } from '~/constants/messages'
import { BookmarkTweetRequestBody } from '~/models/requests/Bookmark.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarkService from '~/services/bookmark.services'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await bookmarkService.bookmarkTweet(user_id, req.body.tweet_id)
  return res.json({
    message: BOOKMARKS_MESSAGES.BOOKMARK_SUCCESS,
    result
  })
}

export const unbookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  await bookmarkService.unbookmarkTweet(user_id, tweet_id)
  return res.json({
    message: BOOKMARKS_MESSAGES.UNBOOKMARK_SUCCESS
  })
}
