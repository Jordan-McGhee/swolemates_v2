-- group members and roles
CREATE VIEW group_members_view AS
SELECT
    gm.group_id,
    g.name AS group_name,
    gm.user_id,
    u.username,
    u.profile_pic,
    gm.is_admin,
    gm.is_mod,
    gm.joined_at
FROM
    group_members gm
    JOIN users u ON gm.user_id = u.user_id
    JOIN groups g ON gm.group_id = g.group_id
ORDER BY
    gm.group_id,
    gm.is_admin DESC,
    gm.is_mod DESC,
    gm.joined_at ASC;

-- pending friend requests
CREATE VIEW friend_requests_view AS
SELECT 
    fr.friend_request_id,
    fr.sender_id,
    sender.username AS sender_username,
    sender.profile_pic AS sender_profile_pic,
    fr.receiver_id,
    receiver.username AS receiver_username,
    receiver.profile_pic AS receiver_profile_pic,
    fr.status,
    fr.created_at
FROM friend_requests fr
JOIN users sender ON fr.sender_id = sender.user_id
JOIN users receiver ON fr.receiver_id = receiver.user_id;

-- posts with likes and comments
CREATE VIEW post_with_likes_comments AS
SELECT
    p.post_id,
    p.user_id,
    u.username,
    u.profile_pic,
    p.content,
    p.image_url,
    p.workout_id,
    p.group_id,
    p.created_at,
    p.updated_at,
    -- Aggregate likes
    COALESCE(
        (
            SELECT
                json_agg(
                    like_data
                    ORDER BY
                        like_data.user_id
                )
            FROM
                (
                    SELECT
                        l.user_id,
                        ul.username,
                        ul.profile_pic
                    FROM
                        likes l
                        JOIN users ul ON l.user_id = ul.user_id
                    WHERE
                        l.post_id = p.post_id
                    ORDER BY
                        l.created_at ASC
                ) AS like_data
        ),
        '[]'
    ) AS likes,
    -- Aggregate comments
    COALESCE(
        (
            SELECT
                json_agg(
                    comment_data
                    ORDER BY
                        comment_data.created_at
                )
            FROM
                (
                    SELECT
                        c.user_id,
                        uc.username,
                        uc.profile_pic,
                        c.content,
                        c.created_at,
                        c.updated_at
                    FROM
                        comments c
                        JOIN users uc ON c.user_id = uc.user_id
                    WHERE
                        c.post_id = p.post_id
                    ORDER BY
                        c.created_at ASC
                ) AS comment_data
        ),
        '[]'
    ) AS comments
FROM
    posts p
    JOIN users u ON p.user_id = u.user_id;


-- group join requests with user info view
CREATE VIEW group_pending_requests_view AS
SELECT 
    gr.request_id,
    gr.group_id,
    gr.user_id,
    u.username,
    u.profile_pic,
    gr.status,
    gr.is_invite,
    gr.requested_at,
    gr.updated_at
FROM group_join_requests gr
JOIN users u ON gr.user_id = u.user_id
WHERE gr.status = 'pending';

-- user feed view with posts (excluding group posts) and workouts
CREATE VIEW user_feeds AS
SELECT 
    cf.user_id,
    cf.username,
    cf.profile_pic,
    json_agg(
        cf.feed_item ORDER BY cf.created_at DESC
    ) AS feed_items,
    
    -- Count posts for this user (excluding posts with non-null group_id)
    COALESCE(pc.post_count, 0) AS post_count,
    
    -- Count workouts for this user  
    COALESCE(wc.workout_count, 0) AS workout_count
FROM (
    -- Posts (excluding group posts)
    SELECT 
        p.user_id,
        p.username,
        p.profile_pic,
        p.created_at,
        json_build_object(
            'type', 'post',
            'post_id', p.post_id,
            'user_id', p.user_id,
            'username', p.username,
            'profile_pic', p.profile_pic,
            'content', p.content,
            'image_url', p.image_url,
            'workout_id', p.workout_id,
            'group_id', p.group_id,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'likes', p.likes,
            'comments', p.comments
        ) AS feed_item
    FROM post_with_likes_comments p
    WHERE p.group_id IS NULL
    
    UNION ALL
    
    -- Workouts
    SELECT 
        w.user_id,
        w.username,
        w.profile_pic,
        w.workout_created_at AS created_at,
        json_build_object(
            'type', 'workout',
            'workout_id', w.workout_id,
            'workout_title', w.workout_title,
            'workout_description', w.workout_description,
            'user_id', w.user_id,
            'username', w.username,
            'profile_pic', w.profile_pic,
            'created_at', w.workout_created_at,
            'exercises', w.exercises,
            'likes', w.likes,
            'comments', w.comments
        ) AS feed_item
    FROM workout_with_likes_comments w
) AS cf

-- Left join to get post counts (excluding posts with non-null group_id)
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) AS post_count
    FROM posts
    WHERE group_id IS NULL
    GROUP BY user_id
) pc ON cf.user_id = pc.user_id

-- Left join to get workout counts  
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) AS workout_count
    FROM workouts
    GROUP BY user_id
) wc ON cf.user_id = wc.user_id

GROUP BY cf.user_id, cf.username, cf.profile_pic, pc.post_count, wc.workout_count
ORDER BY cf.user_id;

-- Updated workout view with new schema
CREATE VIEW workout_with_likes_comments AS
SELECT 
    w.workout_id,
    w.user_id,
    u.username,
    u.profile_pic,
    w.title AS workout_title,
    w.description AS workout_description,
    w.workout_type,
    w.created_at AS workout_created_at,

    -- Aggregate exercises into a JSON array with all flexible fields
    COALESCE(
        (
            SELECT json_agg(exercise_data ORDER BY exercise_data.order_created_at DESC)
            FROM (
                SELECT DISTINCT ON (e.exercise_id)
                    e.exercise_id,
                    e.title,
                    e.exercise_type,
                    e.measurement_type,
                    -- Include all possible workout_exercises fields
                    we.sets,
                    we.reps,
                    we.duration_seconds,
                    we.distance_miles,
                    we.created_at AS order_created_at
                FROM workout_exercises we
                JOIN exercises e ON we.exercise_id = e.exercise_id
                WHERE we.workout_id = w.workout_id
                ORDER BY e.exercise_id, we.created_at DESC  -- Keep most recent entry per exercise
            ) AS exercise_data
        ), '[]'::json
    ) AS exercises,

    -- Aggregate likes into a JSON array
    COALESCE(
        json_agg(
            json_build_object(
                'user_id', l.user_id,
                'username', lu.username,
                'profile_pic', lu.profile_pic
            ) ORDER BY l.created_at ASC
        ) FILTER (WHERE l.user_id IS NOT NULL), '[]'::json
    ) AS likes,

    -- Aggregate comments into a JSON array
    COALESCE(
        json_agg(
            json_build_object(
                'user_id', c.user_id,
                'username', cu.username,
                'profile_pic', cu.profile_pic,
                'content', c.content,
                'created_at', c.created_at,
                'updated_at', c.updated_at
            ) ORDER BY c.created_at ASC
        ) FILTER (WHERE c.comment_id IS NOT NULL), '[]'::json
    ) AS comments

FROM workouts w
LEFT JOIN users u ON w.user_id = u.user_id

-- Join Likes
LEFT JOIN likes l ON w.workout_id = l.workout_id
LEFT JOIN users lu ON l.user_id = lu.user_id

-- Join Comments
LEFT JOIN comments c ON w.workout_id = c.workout_id
LEFT JOIN users cu ON c.user_id = cu.user_id

GROUP BY w.workout_id, w.user_id, u.username, u.profile_pic, w.title, w.description, w.workout_type, w.created_at;


-- Workout sessions view with likes and comments
CREATE VIEW workout_session_with_likes_comments AS
SELECT 
    ws.session_id,
    ws.workout_id,
    ws.user_id,
    u.username,
    u.profile_pic,
    w.title AS workout_title,
    w.description AS workout_description,
    w.workout_type,
    ws.duration_minutes,
    ws.total_distance_miles,
    ws.notes AS session_notes,
    ws.difficulty,
    ws.created_at AS session_created_at,

    -- Aggregate completed exercises into a JSON array
    COALESCE(
        (
            SELECT json_agg(session_exercise_data ORDER BY session_exercise_data.order_created_at DESC)
            FROM (
                SELECT DISTINCT ON (e.exercise_id)
                    e.exercise_id,
                    e.title,
                    e.exercise_type,
                    e.measurement_type,
                    -- Include all actual performance fields
                    se.weight_used,
                    se.sets_completed,
                    se.reps_completed,
                    se.duration_seconds,
                    se.distance_miles,
                    se.pace_minutes_per_mile,
                    se.created_at AS order_created_at
                FROM session_exercises se
                JOIN exercises e ON se.exercise_id = e.exercise_id
                WHERE se.session_id = ws.session_id
                ORDER BY e.exercise_id, se.created_at DESC  -- Keep most recent entry per exercise
            ) AS session_exercise_data
        ), '[]'::json
    ) AS completed_exercises,

    -- Aggregate likes into a JSON array (assuming likes table references session_id)
    COALESCE(
        json_agg(
            json_build_object(
                'user_id', l.user_id,
                'username', lu.username,
                'profile_pic', lu.profile_pic
            ) ORDER BY l.created_at ASC
        ) FILTER (WHERE l.user_id IS NOT NULL), '[]'::json
    ) AS likes,

    -- Aggregate comments into a JSON array (assuming comments table references session_id)
    COALESCE(
        json_agg(
            json_build_object(
                'user_id', c.user_id,
                'username', cu.username,
                'profile_pic', cu.profile_pic,
                'content', c.content,
                'created_at', c.created_at,
                'updated_at', c.updated_at
            ) ORDER BY c.created_at ASC
        ) FILTER (WHERE c.comment_id IS NOT NULL), '[]'::json
    ) AS comments

FROM workout_sessions ws
LEFT JOIN users u ON ws.user_id = u.user_id
LEFT JOIN workouts w ON ws.workout_id = w.workout_id

-- Join Likes (you may need to add session_id column to likes table)
LEFT JOIN likes l ON ws.session_id = l.session_id
LEFT JOIN users lu ON l.user_id = lu.user_id

-- Join Comments (you may need to add session_id column to comments table)
LEFT JOIN comments c ON ws.session_id = c.session_id
LEFT JOIN users cu ON c.user_id = cu.user_id

GROUP BY 
    ws.session_id, ws.workout_id, ws.user_id, u.username, u.profile_pic, 
    w.title, w.description, w.workout_type, ws.duration_minutes, 
    ws.total_distance_miles, ws.notes, ws.difficulty, ws.created_at;