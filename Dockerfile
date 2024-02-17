FROM node:20-alpine as builder

COPY . /work
WORKDIR /work

RUN npm ci
RUN npm run build -w backend
RUN npm run openapi-clients -w frontend
RUN npm run build -w frontend

FROM node:20-alpine as backend

RUN apk add --no-cache curl
COPY . /app
WORKDIR /app

# Dependencies have entire Typescript as production dependency :(
RUN npm ci --omit=dev --ignore-scripts && rm -r node_modules/typescript
COPY --from=builder /work/backend/dist backend

# TODO frontend image
