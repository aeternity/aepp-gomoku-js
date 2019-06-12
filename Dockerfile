FROM node:10.16.0-alpine as aepp-gomoku-build
WORKDIR /app
RUN apk add make gcc g++ python git
COPY  . .
RUN npm install
RUN git clone https://github.com/aeternity/aepp-components.git /aepp-components && cd /aepp-components && npm install && npm run build
RUN npm install /aepp-components
RUN ls node_modules/@aeternity/aepp-components
RUN npm run build

FROM node:10.16.0-alpine
WORKDIR /app
COPY --from=aepp-gomoku-build /app/dist /app
EXPOSE 9000
CMD ["node", "server.js"]