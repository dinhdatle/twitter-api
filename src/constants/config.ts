// // import argv from 'minimist'
// // const options = argv(process.argv.slice(2))
// import dotenv from 'dotenv'
// import fs from 'fs'
// import path from 'path'
// const env = process.env.NODE_ENV
// const envFilename = `.env.${env}`
// if (!env) {
//   console.log(`Bạn chưa cung cấp biến môi trường NODE_ENV (ví dụ: development, production)`)
//   console.log(`Phát hiện NODE_ENV = ${env}`)
//   process.exit(1)
// }
// console.log(`Phát hiện NODE_ENV = ${env}, vì thế app sẽ dùng file môi trường là ${envFilename}`)
// if (!fs.existsSync(path.resolve(envFilename))) {
//   console.log(`Không tìm thấy file môi trường ${envFilename}`)
//   console.log(`Lưu ý: App không dùng file .env, ví dụ môi trường là development thì app sẽ dùng file .env.development`)
//   console.log(`Vui lòng tạo file ${envFilename} và tham khảo nội dung ở file .env.example`)
//   process.exit(1)
// }
// dotenv.config({
//   path: path.resolve(envFilename)
// })

// export const isProduction = env === 'production'

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

const env = process.env.NODE_ENV
const envFilename = `.env.${env}`

if (!env) {
  console.log(`Bạn chưa cung cấp biến môi trường NODE_ENV (ví dụ: development, production)`)
  console.log(`Phát hiện NODE_ENV = ${env}`)
  process.exit(1)
}

console.log(`Phát hiện NODE_ENV = ${env}, vì thế app sẽ dùng file môi trường là ${envFilename}`)
console.log(path.resolve(envFilename))

try {
  const stats = fs.statSync(path.resolve(envFilename))
  if (!stats.isFile()) {
    throw new Error(`Không tìm thấy file môi trường ${envFilename}`)
  }
} catch (err:any) {
  console.error(err.message)
  console.log(`Lưu ý: App không dùng file .env, ví dụ môi trường là development thì app sẽ dùng file .env.development`)
  console.log(`Vui lòng tạo file ${envFilename} và tham khảo nội dung ở file .env.example`)
  process.exit(1)
}

dotenv.config({
  path: envFilename
})


export const isProduction = env === 'production'



