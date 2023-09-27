// import argv from 'minimist'
// const options = argv(process.argv.slice(2))

import {config} from 'dotenv'
import fs from 'fs'
import path from 'path'
const env = process.env.NODE_ENV
// const evnFilename = `.env.${env}`
// if(!env){
//   console.log('Chua cung cap bien moi truong NODE_ENV (vi du: development,production')
//   console.log(`Phat hien NODE_ENV= ${env}`)
//   process.exit(1)
// }
// console.log(`Phat hien NODE_ENV= ${env}, vi the app se dung file moi truong la ${evnFilename}`)
// if(!fs.existsSync(path.resolve(evnFilename))){
//   console.log(`khong tin thay file mot truong ${evnFilename} `)
//   console.log(`Luu y : app khong dung fi;e .env, vi du moi truong development thi app se dung file .env.development`)
//   console.log(`Vui long tao file ${evnFilename} va than khoi noi dung o file .env.example`)
//   process.exit(1)

// }

// config({
//   path: '.env'
// })



export const isProduction = env === 'production'

