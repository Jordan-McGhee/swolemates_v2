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

-- workouts with likes and comments
CREATE VIEW workout_with_likes_comments AS
SELECT
    w.workout_id,
    w.user_id,
    u.username,
    u.profile_pic,
    w.title,
    w.description,
    w.created_at,
    w.updated_at,
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
                        l.workout_id = w.workout_id
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
                        c.workout_id = w.workout_id
                    ORDER BY
                        c.created_at ASC
                ) AS comment_data
        ),
        '[]'
    ) AS comments
FROM
    workouts w
    JOIN users u ON w.user_id = u.user_id;

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

CREATE VIEW workout_with_likes_comments AS
SELECT 
    w.workout_id,
    w.user_id,
    u.username,
    u.profile_pic,
    w.title AS workout_title,
    w.description AS workout_description,
    w.created_at AS workout_created_at,

    -- Aggregate exercises into a JSON array
    COALESCE(
        (
            SELECT json_agg(exercise_data ORDER BY exercise_data.order_created_at DESC)
            FROM (
                SELECT DISTINCT ON (e.exercise_id)
                    e.exercise_id,
                    e.title,
                    e.description,
                    we.weight_used,
                    we.set_count,
                    we.rep_count,
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

GROUP BY w.workout_id, w.user_id, u.username, u.profile_pic, w.title, w.description, w.created_at;
