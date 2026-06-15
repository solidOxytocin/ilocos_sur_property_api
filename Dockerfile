FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

RUN sed -i 's/\r$//' scripts/docker-entry.sh && chmod +x scripts/docker-entry.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "/app/scripts/docker-entry.sh"]