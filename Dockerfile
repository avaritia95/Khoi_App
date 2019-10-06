FROM node:10-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install && npm install -g nodemon
COPY src src

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.6.0/wait /wait
RUN chmod +x /wait

CMD /wait && nodemon -L src/server.js

EXPOSE 8080
