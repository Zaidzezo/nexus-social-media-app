# Nexus

Nexus is a full-stack social media application built using the MERN stack (MongoDB, Express, React, and Node.js). It supports real-time features, secure user authentication, global theme management, and dynamic user feeds.

## Features

* **Real-Time Messaging:** Instant messaging and active connection tracking powered by Socket.io.
* **State Management & Caching:** Profile data caching using local and session storage to reduce unnecessary API requests and server load.
* **Theme Support:** Dark and light mode configurations handled globally across components using Tailwind CSS.
* **Modular UI Components:** Built completely with reusable React components, custom modal portals, dropdown elements, skeleton loaders, and a client-side image cropping layout.
* **Secure Routing:** Route guards and validation middleware for protecting backend endpoints and frontend views.

## Tech Stack

* **Frontend:** React, React Router DOM (v6), Context API, Tailwind CSS, Vite
* **Backend:** Node.js, Express, Socket.io
* **Database:** MongoDB, Mongoose
* **Media Storage:** Cloudinary API

## Local Setup

### 1. Clone the repository
```bash
git clone [https://github.com/Zaidzezo/nexus-social-media-app.git]
cd nexus-social-media-app
```

### 2. Configure environment variables
Create a .env file in the backend/ directory and add your credentials:
```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
### 3. Install dependencies and run locally
Start the backend server:

```bash
cd backend
npm install
npm start
```

Start the frontend client:

```bash
cd ../frontend
npm install
npm run dev
```

