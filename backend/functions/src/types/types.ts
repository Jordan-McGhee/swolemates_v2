export type UserInfo = {
    user_id: number;
    firebase_uid: string;
    email: string;
    username: string;
    profile_pic: string | null;
    bio: string | null;
    created_at: Date;
    updated_at: Date;
};
