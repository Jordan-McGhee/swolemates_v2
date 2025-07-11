import { Request, Response, NextFunction } from "express";
import { pool } from "../index";
import { getUserIdFromFirebaseUid } from "../util/util";

export const checkGroupAccess = async (req: Request, res: Response, next: NextFunction) => {

    const firebaseUid = req.user?.uid;
    const groupId = Number(req.params.group_id);

    if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID." });
    }

    try {
        // Get group info
        const groupResult = await pool.query(
            "SELECT is_private FROM groups WHERE group_id = $1",
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({ message: "Group not found." });
        }

        const { is_private } = groupResult.rows[0];

        if (!is_private) {
            // Public group, allow anyone
            return next();
        }

        // Private group: must be authenticated
        if (!firebaseUid) {
            return res.status(401).json({ message: "Authentication required to access this group." });
        }

        // Get internal user_id from firebase UID
        const user_id = await getUserIdFromFirebaseUid(firebaseUid);

        // Check membership
        const membershipResult = await pool.query(
            "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
            [groupId, user_id]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ message: "Access denied. You are not a member of this private group." });
        }

        // User is a member, allow access
        return next();

    } catch (error) {
        console.error("Error checking group access:", error);
        return res.status(500).json({ message: "Server error during group access check." });
    }
};
