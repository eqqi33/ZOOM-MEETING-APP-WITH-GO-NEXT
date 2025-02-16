import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import errorResponseHandler from '@/utils/axios/errorResponseHandler';
import apiConfig from '@/configs/api';

const instance: AxiosInstance = axios.create({
  withCredentials: true,
  baseURL: 'http://localhost:8000',
  // baseURL: process.env.NEXT_PUBLIC_API_URL,
  responseType: 'json',
  headers: {
    Authorization: null,
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const storedToken = localStorage.getItem(apiConfig.auth.storageTokenKeyName);

    if (storedToken) {
      // @ts-ignore
      config.headers.set("Authorization", 'Bearer ' + storedToken);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use((response: AxiosResponse) => response, errorResponseHandler);

export default instance;
