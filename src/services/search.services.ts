import { Request } from 'express'
import databaseService from './database.services'
import { SearchQuery } from '~/models/requests/Search.requests'
import { ObjectId } from 'mongodb'
import { MediaType, MediaTypeQuery, TweetType } from '~/constants/enums'

class SearchService {
  async search({
    limit,
    page,
    content,
    user_id,
    media_type,
    people_follow
  }: {
    limit: number
    page: number
    content: string
    user_id: string
    media_type?: MediaTypeQuery
    people_follow?: string
  }) {
    //  search theo hinhf anhr
    const $match: any = {
      $text: {
        $search: content
      }
    }

    if (media_type) {
      if (media_type === MediaTypeQuery.Image) {
        $match['medias.type'] = MediaType.Image
      } else if (media_type === MediaTypeQuery.Video) {
        $match['medias.type'] = MediaType.Video
      }
    }
    //  search theo nhung nguoi follow
    if (people_follow && people_follow === '1') {
      // Lấy danh sách user_id đang follow
      const followed_user_ids = await databaseService.follower
        .find({ user_id: new ObjectId(user_id) }, { projection: { followed_user_id: 1, _id: 0 } })
        .toArray()
      const ids = followed_user_ids.map((item) => item.followed_user_id)
      //  lenh push duoi day la lay them ca tweet cua chinh nguoi do
      ids.push(new ObjectId(user_id))
      $match['user_id'] = {
        $in: ids
      }
    }
    //  Lấy các tweet có từ khoá
    const tweets = await databaseService.tweets
      .aggregate([
        {
          $match: $match
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    'user.twitter_circle': {
                      $in: [new ObjectId(user_id)]
                    }
                  }
                ]
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    user_id: {
                      $in: [new ObjectId(user_id)]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
        {
          $addFields: {
            mentions: {
              $map: {
                input: '$mentions',
                as: 'mention',
                in: {
                  _id: '$$mention._id',
                  name: '$$mention.name',
                  username: '$$mention.username'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            from: 'tweets',
            localField: '_id',
            foreignField: 'parent_id',
            as: 'tweet_children'
          }
        },
        {
          $addFields: {
            bookmark_count: {
              $size: '$bookmarks'
            },
            like_count: {
              $size: '$likes'
            },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Retweet]
                  }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Comment]
                  }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            },
            views: {
              $add: ['$user_views', '$guest_views']
            }
          }
        },
        {
          $project: {
            tweet_children: 0,
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              twitter_circle: 0,
              date_of_birth: 0
            }
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    //  Tăng view
    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId) // Lấy id các tweet
    await databaseService.tweets.updateMany(
      {
        _id: { $in: tweet_ids }
      },
      { $inc: { user_views: 1 }, $set: { updated_at: new Date() } }
    )

    // Lấy total các tweet
    const total = await databaseService.tweets
      .aggregate([
        {
          // $match: {
          //   _id: {
          //     $in: tweet_ids
          //   }
          // }
          $match
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    'user.twitter_circle': {
                      $in: [new ObjectId(user_id)]
                    }
                  }
                ]
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    user_id: {
                      $in: [new ObjectId(user_id)]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $count: 'total'
        }
      ])
      .toArray()

    // vi cau lenh phia tren da update view nhung khong fetch lai data nen phai tu + hien ra UI
    tweets.forEach((tweet) => {
      tweet.updated_at = new Date()
      tweet.user_views += 1
    })
    return { tweets, total: total[0]?.total || 0 }
  }
}

const searchService = new SearchService()
export default searchService
