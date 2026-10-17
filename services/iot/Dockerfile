FROM node:24-alpine
WORKDIR /app
COPY services/iot/package.json ./services/iot/package.json
RUN cd services/iot && npm install --omit=dev
COPY services/iot/ ./services/iot/
COPY packages/shared/ ./packages/shared/
WORKDIR /app/services/iot
CMD ["node","worker.mjs"]
