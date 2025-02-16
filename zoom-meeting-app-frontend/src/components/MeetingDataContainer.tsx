import { useGetMeetingQuery } from "@/redux/services/meeting";
import { ReactNode, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { MeetingFormData } from "./Calendar";

// Type definition for Modal props
type ModalProps = {
    setValue: UseFormSetValue<MeetingFormData>;
    idRoom: string | null;
    mode: string;
    children: ReactNode;
};

const MeetingDataContainer = ({ setValue, idRoom, mode, children }: ModalProps) => {
    const { data: getMeetingEdit, error, isSuccess, isError } = useGetMeetingQuery(
        idRoom, { skip: typeof idRoom !== 'undefined' && mode === 'view' ? false : true }
    );
    useEffect(() => {
        if (isSuccess) {
            const rawStartTime = getMeetingEdit?.data?.start_time;
            const formattedStartTime = rawStartTime ? new Date(rawStartTime).toISOString().slice(0, 16).replace("T", " ") : "";
            setValue('id_meeting', getMeetingEdit?.data?.zoom_id ?? '')
            setValue('topic', getMeetingEdit?.data?.topic ?? '')
            setValue('start_time', formattedStartTime ?? '')
            setValue('join_url', getMeetingEdit?.data?.join_url ?? '')
        }
    }, [isSuccess])
    if (isError && mode === 'view') {
        return (
            <>
                {children}
            </>
        );
    };
    if (!isSuccess && mode === 'view') return <p>Loading...</p>;
    return (
        <>
            {children}
        </>
    );
};

export default MeetingDataContainer;
