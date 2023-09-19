FROM node:20.6.1-alpine3.18@sha256:923cd6fac65f6892aa8bbb4208ad708c56b35f9ab86eca07ccc7b56dd28c9c77 as builder

WORKDIR /sources

COPY package*.json .
RUN npm ci 

COPY . . 
RUN npm run build

RUN rm -rf .env

FROM node:20.6.1-alpine3.18@sha256:923cd6fac65f6892aa8bbb4208ad708c56b35f9ab86eca07ccc7b56dd28c9c77

WORKDIR /app

COPY --from=builder /sources .

CMD ["node", "./dist/main.js"]