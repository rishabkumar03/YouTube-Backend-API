
erDiagram
    User {
        ObjectId _id PK
        string username 
        string email 
        string fullname 
        string avatar 
        string coverImage 
        array watchHistory 
        string password 
        string refreshToken
        datetime createdAt
        datetime updatedAt
    }

    Video {
        ObjectId _id PK
        string videoFile 
        string thumbnail 
        string title 
        string description 
        number duration 
        number views 
        boolean isPublished 
        ObjectId owner 
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        ObjectId _id PK
        string content 
        ObjectId video 
        ObjectId owner 
        datetime createdAt
        datetime updatedAt
    }

    Like {
        ObjectId _id PK
        ObjectId comment 
        ObjectId video 
        ObjectId likedBy 
        ObjectId tweet 
        datetime createdAt
        datetime updatedAt
    }

    Playlist {
        ObjectId _id PK
        string name 
        string description 
        array videos 
        ObjectId owner 
        datetime createdAt
        datetime updatedAt
    }

    Subscription {
        ObjectId _id PK
        ObjectId subscriber 
        ObjectId channel 
        datetime createdAt
        datetime updatedAt
    }

    Tweet {
        ObjectId _id PK
        ObjectId owner 
        string content 
        datetime createdAt
        datetime updatedAt
    }

    %% Relationships based on the model files
    User ||--o{ Video : "owner"
    User ||--o{ Comment : "owner"
    User ||--o{ Like : "likedBy"
    User ||--o{ Playlist : "owner"
    User ||--o{ Subscription : "subscriber"
    User ||--o{ Subscription : "channel"
    User ||--o{ Tweet : "owner"
    User ||--o{ Video : "watchHistory"

    Video ||--o{ Comment : "video"
    Video ||--o{ Like : "video"
    Video }|--|| Playlist : "videos"

    Comment ||--o{ Like : "comment"
    Tweet ||--o{ Like : "tweet"