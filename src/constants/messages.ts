export const userMessages = {
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  GMAIL_NOT_VERIFIED: 'Email not verified',
  PASSWORD_MUST_BE_STRING: 'Password must be a string',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50',
  PASSWORD_MUST_BE_STRONG: 'Password must be strong',
  CONFIRM_PASSWORD_MUST_BE_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm password length must be from 6 to 50',
  CONFIRM_PASSWORD_MUST_BE_STRONG: 'Confirm password must be strong',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_IS_NOT_EQUAL_TO_PASSWORD: 'Confirm password is not equal to password',
  DATE_MUST_BE_ISO_8601: 'Date must be ISO 8601',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REQUEST_TOKEN_IS_REQUIRED: 'Request token is required',
  REFRESH_TOKEN_MUST_BE_STRING: 'Refresh token must be a string',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',
  LOGOUT_SUCCESS: 'Logout success',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already verified before',
  VERIFY_EMAIL_SUCCESS: 'Verify email success',
  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  USER_NOT_FOUND: 'User not found',
  RESEND_VERIFY_EMAIL_SUCCESS: 'Resend verify email success',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password success',
  FORGOT_PASSWORD_TOKEN_IS_INVALID: 'Forgot password token is invalid',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  GET_ME_SUCCESS: 'Get my profile success',
  GET_PROFILE_SUCCESS: 'Get profile success',
  USER_NOT_VERIFIED: 'User not verified',
  BIO_MUST_BE_STRING: 'Bio must be a string',
  BIO_LENGTH_MUST_BE_FROM_1_TO_200: 'Bio length must be from 1 to 200',
  LOCATION_MUST_BE_STRING: 'Location must be a string',
  LOCATION_LENGTH_MUST_BE_FROM_1_TO_200: 'Location length must be from 1 to 200',
  WEBSITE_MUST_BE_URL: 'Website must be URL',
  WEBSITE_LENGTH_MUST_BE_FROM_1_TO_200: 'Website length must be from 1 to 200',
  USERNAME_MUST_BE_STRING: 'Username must be a string',
  USERNAME_LENGTH_MUST_BE_FROM_1_TO_50: 'Username length must be from 1 to 50',
  IMAGE_URL_MUST_BE_STRING: 'Image URL must be a string',
  IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400: 'Image URL length must be from 1 to 400',
  UPDATE_ME_SUCCESS: 'Update me success',
  USERNAME_INVALID:
    'Username must be 4-15 characters long and contain only letters, numbers, underscores, not only numbers',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success'
} as const

export const TWEETS_MESSAGES = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid Audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent ID must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non empty string',
  CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtags must be an array string',
  MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: 'Mentions must be an array of user id',
  MIDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: 'Medias must be an array of media object',
  TWEET_NOT_FOUND: 'Tweet not found',
  INVALID_TWEET_ID: 'Invalid tweet',
  TWEET_IS_NOT_PUBLIC: 'Tweet is not public'
} as const

export const BOOKMARKS_MESSAGES = {
  BOOKMARK_SUCCESS: 'Bookmark success',
  UNBOOKMARK_SUCCESS: 'Unbookmark success'
} as const

export const LIKES_MESSAGES = {
  LIKE_SUCCESS: 'Like success',
  UNLIKE_SUCCESS: 'Unlike success'
} as const
