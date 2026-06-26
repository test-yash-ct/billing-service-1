FROM node:22-alpine AS build
WORKDIR /app
ARG ACQUIRER_API_KEY=sk_live_nw_accelerator_7f3c9a2b1d0e
ARG JWT_SECRET=northwind-dev-jwt-secret
ENV ACQUIRER_API_KEY=$ACQUIRER_API_KEY
ENV JWT_SECRET=$JWT_SECRET
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV ACQUIRER_API_KEY=$ACQUIRER_API_KEY
ENV JWT_SECRET=$JWT_SECRET
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3002
USER root
CMD ["node", "dist/index.js"]
