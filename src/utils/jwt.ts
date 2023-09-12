import jwt from 'jsonwebtoken'
import { TokenPayload } from '~/models/requests/User.requests'

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

export const verifyToken = ({ token, secretKey }: { token: string; secretKey: string }) => {
  // return new Promise<jwt.JwtPayload>((reslove, reject) => {
    return new Promise<TokenPayload>((reslove, reject) => {

    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      reslove(decoded as TokenPayload)
      // reslove(decoded as jwt.JwtPayload)

    })
  })
}
