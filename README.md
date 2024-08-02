# Video Editing App

## Overview

The Video Editing App is a web application that allows users to upload, edit, and process videos using various editing features. The frontend is built with React, and the backend is powered by NodeRoute, a lightweight HTTP server framework for Node.js. The backend utilizes FFmpeg for video processing and supports clustering to handle multiple requests efficiently.

## Key Features

1. **Video Upload**: Upload videos to the server for processing.
2. **Video Editing**: Apply various editing features like trimming, merging, adding filters, and more.
3. **FFmpeg Integration**: Use FFmpeg for high-performance video processing.
4. **Clustering**: Utilize Node.js clustering to handle concurrent requests efficiently.
5. **Middleware Support**: Use middleware for logging, authentication, and other request handling needs.
6. **Static File Serving**: Serve static files, such as the frontend React application, from the backend.

## How It Works

### Backend

The backend is built using NodeRoute and integrates FFmpeg for video processing. It utilizes the `child_process` module to execute FFmpeg commands.

### Frontend

The frontend is built with React and provides an intuitive user interface for uploading and editing videos. It communicates with the backend via HTTP APIs.

## Installation and Running the App

### Prerequisites

- Node.js
- npm or yarn
- FFmpeg
- Docker (optional, if running with Docker)

### Installing and Running Without Docker

1. **Clone the Repository**:

    ```bash
    git clone <repository-url>
    cd video-editing-app
    ```

2. **Install Backend Dependencies**:

    ```bash
    cd server
    npm install
    ```

3. **Install Frontend Dependencies**:

    ```bash
    cd client
    npm install
    ```

4. **Start the Frontend**:

    ```bash
    npm run dev
    ```

5. **Start the Backend**:

    ```bash
    cd ../server
    node index.js
    ```

6. **Access the App**:

    Open your browser and navigate to `http://localhost:3000`.

### Running with Docker

1. **Clone the Repository**:

    ```bash
    git clone <repository-url>
    cd video-editing-app
    ```

2. **Build and Run the Docker Containers**:

    ```bash
    docker-compose up --build
    ```

3. **Access the App**:

    Open your browser and navigate to `http://localhost:5173`.


## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.