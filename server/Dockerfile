FROM node:22

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

EXPOSE 4000

CMD [ "node", "server.js" ]
