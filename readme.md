# YouTube Backend API Documentation

This comprehensive YouTube-like backend API is built with Node.js, Express.js, and MongoDB. 
It enables user management, video uploading, comments, likes, 
subscriptions, and more.

## Key Features

- User authentication and authorization
- Video upload, management and publish/unpublish functionality
- Tweet system
- Comment system
- Like/Dislike functionality
- Subscription system
- User playlists
- HealthCheck Test
- Dashboard for analytics

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Testing**: Postman
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Multer for file uploads
- **Cloud Storage**: Cloudinary for image and video storage

## Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/rishabkumar03/Backend-project
    ```

2. Install the required dependencies:
    ```
    npm install -D nodemon prettier
    npm install express mongoose bcrypt jsonwebtoken multer cloudinary dotenv cors cookie-parser mongoose-aggregate-paginate-v2
    ```

3. Copy environment variables:
    ```
    cp .env.example .env
    ```

4. Configure your .env file:
    ```env
    PORT=8000
    CORS_ORIGIN=*
    MONGODB_URI=your_mongodb_connection_string
    ACCESS_TOKEN_SECRET=your_secret_key
    ACCESS_TOKEN_EXPIRY=your_token_expiry
    REFRESH_TOKEN_SECRET=your_refresh_token_secret
    REFRESH_TOKEN_EXPIRY=your_refresh_token_expiry

    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

## Usage

1. Start the development server:
    ```bash
    npm run dev
    ```

2. The server will be running at `http://localhost:8000`.

3. Use Postman or any API client to interact with the endpoints.

## API Endpoints

- **User Routes**:
    - `POST /api/users/register` - Register a new user
    - `POST /api/users/login` - Login a user
    - `POST /api/users/logout` - Logout a user
    - `POST /api/users/refresh-token` - Refresh access token
    - `POST /api/users/change-password` - Change user password
    - `GET /api/users/current-user` - Get current logged-in user
    - `PATCH /api/users/update-account` - Update user account details
    - `PATCH /api/users/avatar` - Update user avatar
    - `PATCH /api/users/cover-image` - Update user cover image
    - `GET /api/users/c/:username` - Get user by username
    - `GET /api/users/history` - Get user watch history
- **Video Routes**:
    - `POST /api/videos/publish-video` - Publish a new video
    - `GET /api/videos/c/:videoId` - Update video details
    - `PATCH /api/videos/update/:videoId` - Update video details
    - `DELETE /api/videos/delete/:videoId` - Delete a video
    - `PUT /api/videos/toggle-status/:videoId` - Toggle video publish status
- **Comment Routes**:
    - `GET /api/comments/:videoId` - Get comments for a video
    - `POST /api/comments/add/:videoId` - Add a comment to a video
    - `PATCH /api/comments/c/:commentId` - Update a comment
    - `DELETE /api/comments/d/:commentId` - Delete a comment
- **Like Routes**:
    - `POST /api/likes/toggle/v/:videoId` - Toggle like/dislike for a video
    - `POST /api/likes/toggle/c/:commentId` - Toggle like/dislike for a comment
    - `POST /api/likes/toggle/t/:tweetId` - Toggle like/dislike for a tweet
    - `GET /api/likes/videos/u/:userId` - Get liked videos of a user
- **Subscription Routes**:
    - `POST /api/subscriptions/c/:channelId` - Subscribe/Unsubscribe to a channel
    - `GET /api/subscriptions/subscribed-channels/:subscriberId` - Get channels a user is subscribed to
    - `GET /api/subscriptions/u/:channelId` - Get subscriptions of a channel
- **Playlist Routes**:
    - `POST /api/playlists/createPlaylist` - Create a new playlist
    - `GET /api/playlists/user/:userId` - Get playlists of a user
    - `GET /api/playlists/:playlistId` - Get a specific playlist
    - `PATCH /api/playlists/add/:videoId/:playlistId` - Add a video to a playlist
    - `PATCH /api/playlists/remove/:videoId/:playlistId` - Remove a video from a playlist
    - `DELETE /api/playlists/delete/:playlistId` - Delete a playlist
    - `PATCH /api/playlists/update/:playlistId` - Update playlist details
- **Tweet Routes**:
    - `POST /api/tweets/create-tweet` - Create a new tweet
    - `GET /api/tweets/user-tweet/:userId` - Get tweets of a user
    - `PATCH /api/tweets/update-tweet/:tweetId` - Update a tweet
    - `DELETE /api/tweets/delete-tweet/:tweetId` - Delete a tweet
- **Health Check**:
    - `GET /api/healthcheck/` - Check server health
- **Dashboard Routes**:
    - `GET /api/dashboard/stats/c/:channelId` - Get channel statistics
    - `GET /api/dashboard/videos/c/:channelId` - Get videos of a channel

## File Structure

```Backend Project
├── git
├── public
├── src
│   ├── controllers
│   ├── db
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── utils
│   ├── app.js
│   ├── constants.js
│   └── index.js
├── .env.sample
├── .gitignore
├── .prettierignore
├── .prettierrc
├── package-lock.json
├── package.json
└── readme.md
```

## Database Schema
The application uses MongoDB with the following main collections:
- **Users**: Stores user information including username, email, password (hashed), profile details, and settings.
- **Videos**: Stores video metadata including title, description, URL, thumbnail, upload date, and associated user.
- **Comments**: Stores comments made on videos, including the comment text, user ID, video ID, and timestamps.
- **Likes**: Stores likes/dislikes for videos and comments, including user ID, target ID, and type (like/dislike).
- **Subscriptions**: Stores user subscriptions to channels, including subscriber ID and channel ID.
- **Playlists**: Stores user-created playlists, including playlist name, description, user ID, and list of video IDs.
- **Tweets**: Stores tweets made by users, including tweet text, user ID, and timestamps.

## How it Works
1. **User Registration and Authentication**: Users can register and log in using their email and password. Passwords are hashed using bcrypt for security. JWT tokens are issued upon successful login for session management.
2. **Video Management**: Authenticated users can upload videos, which are stored in Cloudinary. Users can manage their videos, including updating details, deleting, and toggling publish status.
3. **Comments and Likes**: Users can comment on videos and like/dislike both videos and comments. The system ensures that users can only like or dislike once per item.
4. **Subscriptions**: Users can subscribe to channels to receive updates on new videos. They can also view their subscriptions and the channels they are subscribed to.
5. **Playlists**: Users can create playlists to organize their favorite videos. They can add or remove videos from playlists and manage playlist details.
6. **Tweets**: Users can create, update, and delete tweets. They can also like or dislike tweets.
7. **Dashboard and Analytics**: Channel owners can access a dashboard to view statistics about their videos, including views, likes, comments, and subscriber counts.

## Configuration

### Port Configuration
The application listens on port 8000 by default. You can change this by modifying the `PORT` variable in the `.env` file.

## Known Issues
- Ensure MongoDB is running and accessible via the connection string provided in the `.env` file.
- Cloudinary credentials must be valid for file uploads to work.

## Troubleshooting
- If you encounter issues connecting to MongoDB, verify your connection string and ensure the database server is running.
- For issues with file uploads, check your Cloudinary configuration and API limits.

## Error Handling
The API implements robust error handling to manage various scenarios such as:
- Invalid input data
- Authentication and authorization errors
- Resource not found errors
- Server errors
- Standardized error response format with appropriate HTTP status codes
- JWT-based authentication for secure access to protected routes
- Database validation and error handling using Mongoose

## Security Considerations
- Passwords are hashed using bcrypt before storing in the database.
- JWT tokens are used for secure authentication and authorization.
- Rate limiting and input validation to prevent abuse and attacks.
- HTTP headers are set appropriately to enhance security.

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.