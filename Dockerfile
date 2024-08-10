FROM node:21-alpine

WORKDIR /app

COPY package*.json .
COPY . .

RUN apk update
RUN apk add python3 py3-pip alpine-sdk openssl-dev build-base python3-dev
RUN python3 -m pip install setuptools --break-system-packages
RUN npm i -g @rubynetwork/rammerhead
EXPOSE 8080
ENTRYPOINT ["rammerhead"]
CMD [""]
