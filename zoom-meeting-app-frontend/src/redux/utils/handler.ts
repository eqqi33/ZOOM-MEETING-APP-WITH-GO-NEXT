import { nonRetryStatusCodes } from "@/configs/common";
import axiosBaseQuery from "@/utils/axios/axiosBaseQuery";
import { retry } from "@reduxjs/toolkit/query";

export const baseQuery = retry(
    async (args, api, extraOptions) => {
        const result = await axiosBaseQuery()(args, api, extraOptions);
        const status = (result.error as { status?: number })
        if (status && nonRetryStatusCodes.includes(status?.status ?? 0)) {
            retry.fail(result.error);
        }
        return result;
    },
    { maxRetries: 5 },
);