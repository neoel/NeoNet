FROM node:lts-alpine
WORKDIR /files
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY peerJSSignaling.js .
EXPOSE 8000
ENTRYPOINT ["node"]
CMD ["peerJSSignaling.js"]