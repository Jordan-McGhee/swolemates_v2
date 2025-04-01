import * as functions from "firebase-functions";
import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import { Pool } from "pg"
dotenv.config();

// Create and export db connection
export const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE,
    port: 5432,
    password: process.env.DATABASE_PASSWORD,
    max: 150,
    min: 0
});

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: true }));

// CORS headers
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
    next();
});

// import routes

const friendRoutes = require("./routes/friend-routes")
const groupRoutes = require("./routes/group-routes")
const notificationRoutes = require("./routes/notification-routes")
const postRoutes = require("./routes/post-routes")
const searchRoutes = require("./routes/search-routes")
const userRoutes = require("./routes/user-routes")
const workoutRoutes = require("./routes/workout-routes")

// route handlers

app.use("/friend", friendRoutes)
app.use("/group", groupRoutes)
app.use("/notification", notificationRoutes)
app.use("/post", postRoutes)
app.use("/search", searchRoutes)
app.use("/user", userRoutes)
app.use("/workout", workoutRoutes)

// Error handling middleware
app.use((error: { message: string; code: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
        return next(error);
    }
    res.status(error.code || 500).json({ message: error.message || "Something went wrong!" });
});

// Export Express API as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);