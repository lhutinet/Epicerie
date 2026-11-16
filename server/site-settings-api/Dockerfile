FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY core.js server.js ./
COPY public ./public
USER node
CMD ["node", "server.js"]
