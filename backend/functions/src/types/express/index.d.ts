declare namespace Express {
    export interface Request {
        user?: any; // or use admin.auth.DecodedIdToken
    }
}
