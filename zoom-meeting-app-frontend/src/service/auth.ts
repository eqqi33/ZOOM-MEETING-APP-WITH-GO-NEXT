import { LoginParams } from '@/context/type';
import { AuthMeResponse, AuthResponse } from '@/types/servicesTypes';
import { AxiosResponse } from 'axios';
import apiConfig from '@/configs/api';
import axios from '@/utils/axios';

export const AuthLogin = async (params: LoginParams): Promise<AxiosResponse<AuthResponse>> => {
    return await axios.post(apiConfig.auth.login, params);
};

export const AuthMe = async (): Promise<AxiosResponse<AuthMeResponse>> => {
    const storedToken = window.localStorage.getItem(apiConfig.auth.storageTokenKeyName)!;
    return await axios.get(apiConfig.auth.me, {
        headers: {
            Authorization: storedToken,
        },
    });
};

export const AuthLogout = async (): Promise<AxiosResponse<any>> => {
    const storedToken = window.localStorage.getItem(apiConfig.auth.storageTokenKeyName)!;
    return await axios.get(apiConfig.auth.logout, {
        headers: {
            Authorization: storedToken,
        },
    });
};