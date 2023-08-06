import jwt from 'jsonwebtoken'

export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: jwt.Secret
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((reslove, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      // console.log(options)
      if (error) {
        throw reject(error)
      }
      reslove(token as string)
    })
  })
}

export const verifyToken = ({
  token,
  secretKey = process.env.JWT_SECRET as string
}: {
  token: string
  secretKey?: string
}) => {
  return new Promise<jwt.JwtPayload>((reslove, reject) => {
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      reslove(decoded as jwt.JwtPayload)
    })
  })
}
