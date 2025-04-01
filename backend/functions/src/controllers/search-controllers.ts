import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";

export const searchItems = async (req: Request, res: Response, next: NextFunction) => {
    const { type, query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'The "query" parameter is required. Please provide a search term.' });
    }

    // Default limit for each category is 5 unless a type is specified, then it's 10
    const defaultLimit = 5;
    const typeLimit = 10;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let result: any = { users: [], groups: [], workouts: [] };
        let queryParams = [`%${query}%`];

        // Determine the limit for each category based on whether a type is specified
        const limit = type ? typeLimit : defaultLimit;

        // Search for users if type is not specified or if "users" type is selected
        if (!type || type === 'users') {
            const usersSearchQuery = `
                SELECT user_id, username, profile_pic
                FROM users
                WHERE username ILIKE $1
                LIMIT $2;
            `;
            const usersRes: QueryResult = await client.query(usersSearchQuery, [...queryParams, limit]);
            result.users = usersRes.rows;
        }

        // Search for groups if type is not specified or if "groups" type is selected
        if (!type || type === 'groups') {
            const groupsSearchQuery = `
                SELECT group_id, name, description
                FROM groups
                WHERE name ILIKE $1
                LIMIT $2;
            `;
            const groupsRes: QueryResult = await client.query(groupsSearchQuery, [...queryParams, limit]);
            result.groups = groupsRes.rows;
        }

        // Search for workouts if type is not specified or if "workouts" type is selected
        if (!type || type === 'workouts') {
            const workoutsSearchQuery = `
                SELECT workout_id, title, description
                FROM workouts
                WHERE title ILIKE $1
                LIMIT $2;
            `;
            const workoutsRes: QueryResult = await client.query(workoutsSearchQuery, [...queryParams, limit]);
            result.workouts = workoutsRes.rows;
        }

        await client.query('COMMIT');
        return res.status(200).json({ results: result });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error performing search:', error);
        return res.status(500).json({ message: 'Error performing search. Please try again later.' });
    } finally {
        client.release();
    }
};
