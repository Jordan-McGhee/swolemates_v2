// const bcrypt = require('bcryptjs');
// import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
// const { validationResult } = require("express-validator")
// import { QueryResult } from "pg";
import { checkIfUsernameExists } from "../util/util";

// Check username availability
export const checkUsernameAvailability = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.body;

    try {
        const usernameExists = await checkIfUsernameExists(username);

        if (usernameExists) {
            return res.status(400).json({ message: "Username is already taken." });
        }

        return res.status(200).json({ message: "Username is available." });
    } catch (error) {
        console.error("Error checking username availability:", error);
        return res.status(500).json({ message: `Error checking username availability: ${error}` });
    }
};