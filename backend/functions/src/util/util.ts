import jwt from "jsonwebtoken";
import { pool } from "../index"
import { QueryResult } from "pg";


// generate token
const JWT_TOKEN = process.env.JWT_TOKEN as string;

export const generateToken = (user_id: string) => {
    return jwt.sign({ user_id }, JWT_TOKEN, { expiresIn: "1d" });
};

// helper function to check if username exists in the database
export const checkIfUsernameExists = async (username: string) => {
    const query = "SELECT id FROM users WHERE username = $1";
    const result: QueryResult = await pool.query(query, [username]);
    return result.rows.length > 0;
};

// Helper function to check if a string is a valid email
export const isEmailFormat = (value: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
};
