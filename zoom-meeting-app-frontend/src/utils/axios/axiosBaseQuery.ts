import { BaseQueryFn } from "@reduxjs/toolkit/query"
import { AxiosError, AxiosRequestConfig } from "axios"
import axios from '@/utils/axios';

const axiosBaseQuery =
    (): BaseQueryFn<
        {
            url: string
            method?: AxiosRequestConfig['method']
            data?: AxiosRequestConfig['data']
            params?: AxiosRequestConfig['params']
            headers?: AxiosRequestConfig['headers']
        },
        unknown,
        unknown
    > =>
        async ({ url, method, data, params, headers }) => {
            try {
                const result = await axios({
                    url: url,
                    method,
                    data,
                    params,
                    headers,
                })
                return { data: result.data }
            } catch (axiosError) {
                const err = axiosError as AxiosError
                return {
                    error: {
                        status: err.status,
                        data: err.response?.data || err.message,
                    },
                }
            }
        }

export default axiosBaseQuery;