FROM node:20-alpine as builder

COPY . /work
WORKDIR /work

RUN --mount=type=cache,target=/work/.npm npm ci
RUN npm run build -w shared
RUN npm run build -w backend
RUN npm run openapi-clients -w frontend
RUN npm run build -w frontend

FROM node:20-alpine

RUN apk add --no-cache curl
COPY . /app
WORKDIR /app
COPY docker-entrypoint.sh /app/entrypoint.sh

RUN npm ci --omit=dev --ignore-scripts && rm -r /root/.npm
COPY --from=builder /work/shared/dist shared/src
COPY --from=builder /work/backend/dist backend

# Frontend static files
COPY --from=builder /work/frontend/dist /app/frontend
ENV SERVE_FRONTEND_DIR /app/frontend
ENV NODE_ENV prod

ENTRYPOINT [ "./entrypoint.sh" ]
CMD [ "run" ]