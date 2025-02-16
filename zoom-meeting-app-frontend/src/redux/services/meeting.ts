import { ApiResponse, MeetingResponseData } from "@/interface/commonInterface";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../utils/handler";

const pathModule = '/meetings';
export const meetingApi = createApi({
    reducerPath: "meetingApi",
    baseQuery: baseQuery,
    tagTypes: ['Meeting'],
    endpoints: (builder) => ({
        getMeeting: builder.query<ApiResponse<MeetingResponseData>, any>({
            query: (id) => ({ url: `${pathModule}/${id}`, method: 'get' }),
            transformResponse: (response: ApiResponse<MeetingResponseData>) => {
                // Example transformation: add a new field or modify existing fields
                return {
                    ...response
                };
            },
            providesTags: (result, error, id) => [{ type: 'Meeting', id }],
        }),
        getMeetings: builder.query<ApiResponse<MeetingResponseData[]>, any>({
            query: (args) => ({ url: `${pathModule}/`, method: 'get', params: { ...args } }),
            // Provides a list of `Posts` by `id`.
            // If any mutation is executed that `invalidate`s any of these tags, this query will re-run to be always up-to-date.
            // The `LIST` id is a "virtual id" we just made up to be able to invalidate this query specifically if a new `Posts` element was added.
            // Transform the response data
            transformResponse: (response: ApiResponse<MeetingResponseData[]>) => {
                console.log('response : ', response)
                // Here you can transform the response data as needed
                // For example, let's assume you want to add a fullName property to each agent
                return {
                    ...response,
                };
            },
            providesTags: (result) => result
                ? // successful query
                [
                    ...result.data.map(({ ID }) => ({ type: 'Meeting', id: ID } as const)),
                    { type: 'Meeting', id: 'LIST' },
                ]
                : // an error occurred, but we still want to refetch this query when `{ type: 'Posts', id: 'LIST' }` is invalidated
                [{ type: 'Meeting', id: 'LIST' }],

        }),
        createMeetings: builder.mutation({
            query: (data) => ({
                url: `${pathModule}/`,
                method: 'post',
                data,
            }),
            // Invalidates all queries that subscribe to this Post `id` only.
            // In this case, `getPost` will be re-run. `getPosts` *might*  rerun, if this id was under its results.
            invalidatesTags: (result, error, { id }) => [{ type: 'Meeting', id: 'LIST' }],
        }),
        updateMeeting: builder.mutation({
            query: ({ id, data }) => ({
                url: `${pathModule}/${id}`,
                method: 'put',
                data,
            }),
            // Invalidates all queries that subscribe to this Post `id` only.
            // In this case, `getPost` will be re-run. `getPosts` *might*  rerun, if this id was under its results.
            invalidatesTags: (result, error, { id }) => [{ type: 'Meeting', id: 'LIST' }],
        }),
        deleteMeeting: builder.mutation({
            query: (id) => ({
                url: `${pathModule}/${id}`,
                method: 'delete',
            }),
            // Invalidates all queries that subscribe to this Post `id` only.
            // In this case, `getPost` will be re-run. `getPosts` *might*  rerun, if this id was under its results.
            invalidatesTags: (result, error, id) => [{ type: 'Meeting', id: 'LIST' }],
        })
    }),
});

export const {
    useGetMeetingQuery,
    useGetMeetingsQuery,
    useCreateMeetingsMutation,
    useUpdateMeetingMutation,
    useDeleteMeetingMutation
} = meetingApi