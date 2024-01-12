FROM node:lts-alpine
WORKDIR /files
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY peerJS.js .
EXPOSE 5000
ENTRYPOINT ["node"]
CMD ["peerJS.js"]