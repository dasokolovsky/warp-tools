FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run db:migrate
RUN npm run build

EXPOSE 3005
CMD ["npm", "start"]
