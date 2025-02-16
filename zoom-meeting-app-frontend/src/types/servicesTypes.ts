import { ApiResponse, LoginResponseData, User } from "@/interface/commonInterface";

export type AuthResponse = ApiResponse<LoginResponseData>;
export type AuthLogoutResponse = ApiResponse<any>;
export type AuthMeResponse = ApiResponse<User>;

export type UserType = {
    id: number
    email: string
    name: string
    is_active: boolean
}

export type UserStoreType = {
    user: UserType | null
}

export type MeetingType = {
    ID: number
    CreatedAt: string
    UpdatedAt?: string | null
    DeletedAt?: string | null
    zoom_id: string
    topic: string
    start_time: string
    join_url: string    
}

export type MeetingStoreType = {
    meeting: MeetingType | null
}