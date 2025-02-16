export interface User {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
}


export interface fetchDataParams {
    page?: number;
    size?: number;
    name?: string;
    email?: string;
}

export interface metaPagination {
    total: number,
    page: number,
    size: number,
    totalPage: number,
    currentPage: number,
    prev?: number | null,
    next?: number | null
}

export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
    params?: fetchDataParams;
    meta?: metaPagination
}

export interface LoginResponseData {
    accessToken?: string;
    user: User;
}

export interface MeetingResponseData {
    ID: number;
    CreatedAt: string;
    UpdatedAt?: string | null;
    DeletedAt?: string | null;
    zoom_id: string;
    topic: string;
    start_time: string;
    join_url: string;
}