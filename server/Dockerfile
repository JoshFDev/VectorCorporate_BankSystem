FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/index.js"]
