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
    -- Aggregate comments with their likes
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'comment_id', comment_data.comment_id,
                        'user_id', comment_data.user_id,
                        'username', comment_data.username,
                        'profile_pic', comment_data.profile_pic,
                        'content', comment_data.content,
                        'created_at', comment_data.created_at,
                        'updated_at', comment_data.updated_at,
                        'likes', comment_data.likes
                    )
                    ORDER BY
                        comment_data.created_at
                )
            FROM
                (
                    SELECT
                        c.comment_id,
                        c.user_id,
                        uc.username,
                        uc.profile_pic,
                        c.content,
                        c.created_at,
                        c.updated_at,
                        -- Nested aggregation for comment likes
                        COALESCE(
                            (
                                SELECT
                                    json_agg(
                                        json_build_object(
                                            'user_id', cl.user_id,
                                            'username', ucl.username,
                                            'profile_pic', ucl.profile_pic
                                        )
                                        ORDER BY cl.created_at ASC
                                    )
                                FROM
                                    likes cl
                                    JOIN users ucl ON cl.user_id = ucl.user_id
                                WHERE
                                    cl.comment_id = c.comment_id
                            ),
                            '[]'
                        ) AS likes
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
        (
            SELECT
                json_agg(
                    json_build_object(
                        'user_id', like_data.user_id,
                        'username', like_data.username,
                        'profile_pic', like_data.profile_pic
                    )
                    ORDER BY like_data.created_at ASC
                )
            FROM
                (
                    SELECT
                        l.user_id,
                        lu.username,
                        lu.profile_pic,
                        l.created_at
                    FROM
                        likes l
                        JOIN users lu ON l.user_id = lu.user_id
                    WHERE
                        l.workout_id = w.workout_id
                    ORDER BY
                        l.created_at ASC
                ) AS like_data
        ),
        '[]'::json
    ) AS likes,

    -- Aggregate comments with their likes into a JSON array
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'comment_id', comment_data.comment_id,
                        'user_id', comment_data.user_id,
                        'username', comment_data.username,
                        'profile_pic', comment_data.profile_pic,
                        'content', comment_data.content,
                        'created_at', comment_data.created_at,
                        'updated_at', comment_data.updated_at,
                        'likes', comment_data.likes
                    )
                    ORDER BY comment_data.created_at ASC
                )
            FROM
                (
                    SELECT
                        c.comment_id,
                        c.user_id,
                        cu.username,
                        cu.profile_pic,
                        c.content,
                        c.created_at,
                        c.updated_at,
                        -- Nested aggregation for comment likes
                        COALESCE(
                            (
                                SELECT
                                    json_agg(
                                        json_build_object(
                                            'user_id', cl.user_id,
                                            'username', ucl.username,
                                            'profile_pic', ucl.profile_pic
                                        )
                                        ORDER BY cl.created_at ASC
                                    )
                                FROM
                                    likes cl
                                    JOIN users ucl ON cl.user_id = ucl.user_id
                                WHERE
                                    cl.comment_id = c.comment_id
                            ),
                            '[]'::json
                        ) AS likes
                    FROM
                        comments c
                        JOIN users cu ON c.user_id = cu.user_id
                    WHERE
                        c.workout_id = w.workout_id
                    ORDER BY
                        c.created_at ASC
                ) AS comment_data
        ),
        '[]'::json
    ) AS comments

FROM workouts w
LEFT JOIN users u ON w.user_id = u.user_id;

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

    -- Aggregate likes into a JSON array
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'user_id', like_data.user_id,
                        'username', like_data.username,
                        'profile_pic', like_data.profile_pic
                    )
                    ORDER BY like_data.created_at ASC
                )
            FROM
                (
                    SELECT
                        l.user_id,
                        lu.username,
                        lu.profile_pic,
                        l.created_at
                    FROM
                        likes l
                        JOIN users lu ON l.user_id = lu.user_id
                    WHERE
                        l.session_id = ws.session_id
                    ORDER BY
                        l.created_at ASC
                ) AS like_data
        ),
        '[]'::json
    ) AS likes,

    -- Aggregate comments with their likes into a JSON array
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'comment_id', comment_data.comment_id,
                        'user_id', comment_data.user_id,
                        'username', comment_data.username,
                        'profile_pic', comment_data.profile_pic,
                        'content', comment_data.content,
                        'created_at', comment_data.created_at,
                        'updated_at', comment_data.updated_at,
                        'likes', comment_data.likes
                    )
                    ORDER BY comment_data.created_at ASC
                )
            FROM
                (
                    SELECT
                        c.comment_id,
                        c.user_id,
                        cu.username,
                        cu.profile_pic,
                        c.content,
                        c.created_at,
                        c.updated_at,
                        -- Nested aggregation for comment likes
                        COALESCE(
                            (
                                SELECT
                                    json_agg(
                                        json_build_object(
                                            'user_id', cl.user_id,
                                            'username', ucl.username,
                                            'profile_pic', ucl.profile_pic
                                        )
                                        ORDER BY cl.created_at ASC
                                    )
                                FROM
                                    likes cl
                                    JOIN users ucl ON cl.user_id = ucl.user_id
                                WHERE
                                    cl.comment_id = c.comment_id
                            ),
                            '[]'::json
                        ) AS likes
                    FROM
                        comments c
                        JOIN users cu ON c.user_id = cu.user_id
                    WHERE
                        c.session_id = ws.session_id
                    ORDER BY
                        c.created_at ASC
                ) AS comment_data
        ),
        '[]'::json
    ) AS comments

FROM workout_sessions ws
LEFT JOIN users u ON ws.user_id = u.user_id
LEFT JOIN workouts w ON ws.workout_id = w.workout_id;


-- Updated user feed view with posts (excluding group posts), workout templates, and workout sessions
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
    
    -- Count workout templates for this user  
    COALESCE(wc.workout_count, 0) AS workout_count,
    
    -- Count workout sessions for this user
    COALESCE(wsc.workout_session_count, 0) AS workout_session_count
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
    
    -- Workout Templates
    SELECT 
        w.user_id,
        w.username,
        w.profile_pic,
        w.workout_created_at AS created_at,
        json_build_object(
            'type', 'workout',
            'workout_id', w.workout_id,
            'workout_title', w.workout_title,
            'workout_type', w.workout_type,
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
    
    UNION ALL
    
    -- Workout Sessions
    SELECT 
        ws.user_id,
        ws.username,
        ws.profile_pic,
        ws.session_created_at AS created_at,
        json_build_object(
            'type', 'session',
            'session_id', ws.session_id,
            'workout_id', ws.workout_id,
            'workout_title', ws.workout_title,
            'workout_description', ws.workout_description,
            'workout_type', ws.workout_type,
            'user_id', ws.user_id,
            'username', ws.username,
            'profile_pic', ws.profile_pic,
            'duration_minutes', ws.duration_minutes,
            'total_distance_miles', ws.total_distance_miles,
            'session_notes', ws.session_notes,
            'difficulty', ws.difficulty,
            'created_at', ws.session_created_at,
            'completed_exercises', ws.completed_exercises,
            'likes', ws.likes,
            'comments', ws.comments
        ) AS feed_item
    FROM workout_session_with_likes_comments ws
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

-- Left join to get workout template counts  
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) AS workout_count
    FROM workouts
    GROUP BY user_id
) wc ON cf.user_id = wc.user_id

-- Left join to get workout session counts
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) AS workout_session_count
    FROM workout_sessions
    GROUP BY user_id
) wsc ON cf.user_id = wsc.user_id

GROUP BY cf.user_id, cf.username, cf.profile_pic, pc.post_count, wc.workout_count, wsc.workout_session_count
ORDER BY cf.user_id;