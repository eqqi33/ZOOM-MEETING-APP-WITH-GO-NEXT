import { ApiResponse } from "@/interface/commonInterface";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../utils/handler";

const pathModule = '/user';
export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: baseQuery,
    tagTypes: ['User'],
    endpoints: (builder) => ({
    }),
});

export const { } = userApi