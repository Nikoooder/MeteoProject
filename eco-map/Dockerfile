FROM node:22
WORKDIR /app
COPY ./package.json .
COPY ./src .
COPY ./index.html .
COPY ./tsconfig.json .
COPY ./vite.config.ts .
COPY ./tsconfig.app.json .
COPY ./tsconfig.node.json .
COPY ./eslint.config.js .
COPY ./public .
RUN npm install 
CMD ["npm","run","dev"]

