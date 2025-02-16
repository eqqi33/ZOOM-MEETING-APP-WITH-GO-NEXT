export type UserDataType = {
    id: number;
    email: string;
    name: string;
};

export type ErrCallbackType = (err: { [key: string]: string }) => void

export type LoginParams = {
    email: string
    password: string
}

export type AuthValuesType = {
    user: UserDataType | null
    login: (params: LoginParams, errorCallback?: ErrCallbackType) => void
    logout: () => void
}