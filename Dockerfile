FROM node:10-alpine

ENV  NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

CMD node server.js

EXPOSE 8080