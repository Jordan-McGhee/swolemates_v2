import { Request, Response, NextFunction } from "express";
import { admin } from "../firebase-admin";

export const verifyFirebaseToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided." });
    }

    const idToken = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // Attach decoded token to request for later use
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            sign_in_provider: decodedToken.firebase.sign_in_provider,
        };
        return next();
    } catch (err) {
        console.error("Error verifying token:", err);
        return res.status(401).json({ message: "Unauthorized." });
    }
};
