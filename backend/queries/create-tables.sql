-- ENUMS
CREATE TYPE notification_type AS ENUM (
    'friend_request',
    'comment',
    'like',
    'group_invite',
    'post_mention'
);

CREATE TYPE reference_type AS ENUM (
    'post',
    'workout',
    'friend_request',
    'comment'
);

-- TABLES
create TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE,
    email VARCHAR (55) UNIQUE,
    password_hash VARCHAR(55),
    profile_pic VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workouts (
    workout_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    content TEXT,
    image_url VARCHAR(255) NULL,
    workout_id INT REFERENCES workouts(workout_id) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercises (
    exercise_id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_exercises (
    workout_id INT REFERENCES workouts(workout_id),
    exercise_id INT REFERENCES exercises(exercise_id),
    weight_used INT NULL,
    set_count INT NULL,
    rep_count INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workout_id, exercise_id)
);

CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    creator_id INT REFERENCES users(user_id),
    name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    user_id INT REFERENCES users(user_id),
    group_id INT REFERENCES groups(group_id),
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE friend_requests (
    request_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id),
    receiver_id INT NOT NULL REFERENCES users(user_id),
    status VARCHAR(20) NOT NULL,  -- e.g., 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id),
    sender_username VARCHAR(255) NOT NULL,
    sender_profile_pic TEXT,
    receiver_id INT NOT NULL REFERENCES users(user_id),
    receiver_username VARCHAR(255) NOT NULL,
    receiver_profile_pic TEXT,
    type notification_type,
    message TEXT,
    reference_type REFERENCE_TYPE NOT NULL,
    reference_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    post_id INT REFERENCES posts(post_id),
    workout_id INT REFERENCES workouts(workout_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    like_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    post_id INT REFERENCES posts(post_id) NULL,
    workout_id INT REFERENCES workouts(workout_id),
    comment_id INT REFERENCES comments(comment_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);