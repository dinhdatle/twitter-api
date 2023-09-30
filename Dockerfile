FROM node:20-alpine3.16

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
# COPY .env .
COPY .env.production .
COPY ./src ./src
COPY twitter-swagger.yaml .

RUN apk add python3
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

