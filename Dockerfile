FROM node:22-alpine

RUN corepack enable

WORKDIR /app

ENV NODE_ENV=development
ENV PNPM_HOME=/app/.pnpm-store

CMD ["tail", "-f", "/dev/null"]
