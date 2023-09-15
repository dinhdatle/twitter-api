import { LikeTweetReqBody } from '~/models/requests/Like.request'
import databaseService from './database.services'
import Like from '~/models/schemas/Like.schema'
import { ObjectId } from 'mongodb'

class LikesService {
  async likeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result.value
  }
  async unlikeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })

    return result
  }
}

const likessService = new LikesService()
export default likessService
