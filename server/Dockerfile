FROM node:22-alpine3.19

# Install dependencies
RUN apk update && apk add --no-cache \
    bash \
    build-base \
    yasm \
    pkgconfig \
    libressl-dev \
    fdk-aac-dev \
    x264-dev \
    git \
    nasm \
    curl

RUN git clone https://github.com/FFmpeg/FFmpeg.git

RUN /FFmpeg/configure
RUN make
RUN make install

# Verify the installation
RUN ffmpeg -version

# Set up the application
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5173

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["sh", "/app/start.sh"]
