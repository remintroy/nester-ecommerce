FROM node:alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8080
EXPOSE 8081

CMD [ "npm", "start" ]