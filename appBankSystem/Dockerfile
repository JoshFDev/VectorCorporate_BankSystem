FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist/app-bank-system/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200
