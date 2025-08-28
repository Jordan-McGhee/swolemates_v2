-- ENUMS
CREATE TYPE notification_type AS ENUM (
    'friend_request',
    'comment',
    'like',
    'group_invite',
    'group_change',
    'post_mention'
);

CREATE TYPE reference_type AS ENUM (
    'post',
    'workout',
    'friend_request',
    'comment',
    'group',
    'session'
);

CREATE TYPE workout_type_enum AS ENUM (
    'strength', 
    'cardio', 
    'hiit', 
    'run', 
    'yoga', 
    'stretching', 
    'swimming', 
    'cycling', 
    'crossfit', 
    'bodyweight',
    'other'
);

CREATE TYPE exercise_type_enum AS ENUM (
    'strength', 
    'cardio', 
    'stretch', 
    'plyometric', 
    'balance', 
    'flexibility', 
    'endurance',
    'other'
);

CREATE TYPE measurement_type_enum AS ENUM (
    'reps', 
    'time', 
    'distance', 
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

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    content TEXT,
    image_url VARCHAR(255) NULL,
    workout_id INT REFERENCES workouts(workout_id) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    creator_id INT REFERENCES users(user_id),
    name VARCHAR(255),
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    user_id INT REFERENCES users(user_id),
    group_id INT REFERENCES groups(group_id),
    is_admin BOOLEAN DEFAULT FALSE,
    is_mod BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE group_join_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    group_id INT REFERENCES groups(group_id),
    status VARCHAR(15), -- 'pending', 'accepted', 'rejected'
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    receiver_username VARCHAR(255),
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

-- Core workout template table (with workout_type enum)
CREATE TABLE workouts (
    workout_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    workout_type workout_type_enum DEFAULT 'strength',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise library/database (with enums)
CREATE TABLE exercises (
    exercise_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    exercise_type exercise_type_enum DEFAULT 'strength',
    measurement_type measurement_type_enum DEFAULT 'reps',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for workout templates (flexible measurements)
CREATE TABLE workout_exercises (
    workout_id INT REFERENCES workouts(workout_id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    sets INT NULL,                          -- For strength: number of sets
    reps INT NULL,                          -- For strength: reps per set
    duration_seconds INT NULL,              -- For cardio/time-based: duration
    distance_miles INT NULL,               -- For runs/cardio: distance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workout_id, exercise_id)
);

-- Table for completed workout sessions
CREATE TABLE workout_sessions (
    session_id SERIAL PRIMARY KEY,
    workout_id INT REFERENCES workouts(workout_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    duration_minutes INT NULL,
    total_distance_miles INT NULL,         -- For runs/cardio sessions
    notes TEXT,
    difficulty INT CHECK (difficulty >= 1 AND difficulty <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for actual exercise performance (flexible measurements)
CREATE TABLE session_exercises (
    session_exercise_id SERIAL PRIMARY KEY,
    session_id INT REFERENCES workout_sessions(session_id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    weight_used INT NULL,                   -- For strength exercises
    sets_completed INT NULL,                -- For strength exercises  
    reps_completed INT NULL,                -- For strength exercises
    duration_seconds INT NULL,              -- For time-based exercises
    distance_miles INT NULL,               -- For distance-based exercises
    pace_minutes_per_mile VARCHAR(10) NULL,           -- For running (e.g., "8:30" per mile)
    exercise_target JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample exercise data for different types using ENUMs
INSERT INTO exercises (title, exercise_type, measurement_type) VALUES
-- Strength exercises (reps-based)
('Bench Press', 'strength', 'reps'),
('Squats', 'strength', 'reps'),
('Deadlifts', 'strength', 'reps'),
('Pull-ups', 'strength', 'reps'),

-- Time-based exercises
('Plank', 'strength', 'time'),
('Running', 'cardio', 'time'),
('Cycling', 'cardio', 'time'),
('Yoga Flow', 'flexibility', 'time'),
('Mountain Climbers', 'plyometric', 'time'),

-- Distance-based exercises
('5K Run', 'cardio', 'distance'),
('Sprint Intervals', 'plyometric', 'distance'),
('Swimming Laps', 'cardio', 'distance'),
('Walking', 'cardio', 'distance'),

-- Calorie-based exercises (for generic activities)
('Elliptical Machine', 'cardio', 'calories'),
('Rowing Machine', 'cardio', 'calories'),
('Stair Climber', 'cardio', 'calories'),

-- Stretching/flexibility exercises
('Hamstring Stretch', 'stretch', 'time'),
('Hip Flexor Stretch', 'stretch', 'time'),
('Shoulder Rolls', 'flexibility', 'reps');

-- Create indexes for better performance
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_created_at ON workouts(created_at DESC);
CREATE INDEX idx_workouts_workout_type ON workouts(workout_type);

CREATE INDEX idx_exercises_title ON exercises(title);
CREATE INDEX idx_exercises_exercise_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_measurement_type ON exercises(measurement_type);

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);

CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_workout_id ON workout_sessions(workout_id);
CREATE INDEX idx_workout_sessions_created_at ON workout_sessions(created_at DESC);

CREATE INDEX idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX idx_session_exercises_exercise_id ON session_exercises(exercise_id);