"use client";

import React, { useEffect, useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useCreateMeetingsMutation, useDeleteMeetingMutation, useGetMeetingQuery, useGetMeetingsQuery, useUpdateMeetingMutation } from "@/redux/services/meeting";
import { MeetingResponseData } from "@/interface/commonInterface";
import { Modal } from "./ui/modal";
import * as yup from 'yup'
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert } from "./ui/alert";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import MeetingDataContainer from "./MeetingDataContainer";
import { useAuth } from "@/hooks/useAuth";

const schema = yup.object().shape({
    id_meeting: yup.string(),
    topic: yup.string().required(),
    start_time: yup.string().required(),
    join_url: yup.string(),
})

const defaultValues = {
    id_meeting: '',
    topic: '',
    start_time: '',
    join_url: '',
}

export interface MeetingFormData {
    id_meeting?: string
    topic: string
    start_time: string
    join_url?: string
}

function Calendar() {
    // ** Hook
    const { logout } = useAuth();
    const [idRoom, setIdRoom] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('add');
    const [alert, setAlert] = useState<boolean>(false)
    const [messageAlert, setMessageAlert] = useState<string>('')
    const [statusAlert, setStatusAlert] = useState<'danger' | 'error' | 'success'>('error')
    const [showSidebar, setShowSidebar] = useState<boolean>(false)
    const [createMeeting, { isLoading: isLoadingCreate }] = useCreateMeetingsMutation()
    const [updateMeeting, { isLoading: isLoadingUpdate }] = useUpdateMeetingMutation()
    const [deleteMeeting] = useDeleteMeetingMutation()
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<{ id: string; topic: string } | null>(null);
    const [month, setMonth] = useState(Temporal.Now.plainDateISO().month);
    const [year, setYear] = useState(Temporal.Now.plainDateISO().year);
    const [allMeetings, setAllMeetings] = useState<MeetingResponseData[]>([]);
    const [monthCalendar, setMonthCalendar] = useState<
        { date: Temporal.PlainDate; isInMonth: boolean; meetings?: any[] }[]
    >([]);
    const { data: getMeetings, refetch: refetchMeetings } = useGetMeetingsQuery({});
    const today = Temporal.Now.plainDateISO(); // Get today's date

    const {
        watch,
        control,
        setError,
        setValue,
        clearErrors,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues,
        mode: 'onBlur',
        resolver: yupResolver(schema)
    });
    const watchIdMeeting = watch("id_meeting");
    const watchTopic = watch("topic");
    const watchStartTime = watch("start_time");
    const watchJoinUrl = watch("join_url");
    const onSubmit = (data: MeetingFormData) => {
        if (!isLoadingCreate && mode === 'add') {
            const localTime = Temporal.PlainDateTime.from(data.start_time.replace(" ", "T"));
            let submit: Partial<MeetingFormData> = { ...data, start_time: localTime.toString() + "Z" };
            delete submit.id_meeting
            createMeeting(submit).unwrap().then(() => {
                setIsOpen(false);
                setStatusAlert('success');
                setAlert(true)
                setMessageAlert('success create meeting')
                reset();
                setTimeout(() => {
                    setAlert(false);
                    setMessageAlert('')
                }, 10000);
            }).catch(() => {
                setStatusAlert('error');
                setAlert(true)
                setMessageAlert('failed create meeting')
                setTimeout(() => {
                    setAlert(false);
                    setMessageAlert('')
                }, 10000);
            })
        }
        else if (mode === 'edit') {
            const localTime = Temporal.PlainDateTime.from(data.start_time.replace(" ", "T"));
            let submit: Partial<MeetingFormData> = { ...data, start_time: localTime.toString() + "Z" };
            updateMeeting({ id: idRoom, data: { topic: submit.topic, start_time: submit.start_time } }).unwrap().then((fulfilled) => {
                setIsOpen(false);
                setStatusAlert('success');
                setAlert(true)
                setMessageAlert('success update meeting')
                reset();
                setTimeout(() => {
                    setAlert(false);
                    setMessageAlert('')
                }, 10000);
            }).catch((rejected) => {
                setStatusAlert('error');
                setAlert(true)
                setMessageAlert('failed update meeting')
                setTimeout(() => {
                    setAlert(false);
                    setMessageAlert('')
                }, 10000);
            })
        }
    }

    const next = () => {
        const { month: nextMonth, year: nextYear } = Temporal.PlainYearMonth.from({
            month,
            year,
        }).add({ months: 1 });
        setMonth(nextMonth);
        setYear(nextYear);
    };

    const previous = () => {
        const { month: prevMonth, year: prevYear } = Temporal.PlainYearMonth.from({
            month,
            year,
        }).subtract({ months: 1 });
        setMonth(prevMonth);
        setYear(prevYear);
    };

    // Open modal for adding a new meeting
    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        setSelectedMeeting(null);
        setMode('add');
        setIsOpen(true);
    };

    // Open modal for editing an existing meeting
    const handleMeetingClick = (meeting: { id: string; topic: string, start_time: string, selected_date: string }) => {
        setSelectedDate(meeting.selected_date);
        setIdRoom(meeting.id)
        setSelectedMeeting(meeting);
        setMode('view');
        setIsOpen(true);
    };

    const closeModal = () => {
        setValue('topic', '')
        setValue('start_time', '')
        setIsOpen(false)
    }

    const deleteAction = () => {
        setMode('delete')
    }

    const toEditForm = () => {
        setMode('edit')
    }

    const backToView = () => {
        setMode('view')
    }

    const seeAllMeeting = () => {
        setShowSidebar(!showSidebar)
    }

    const handleLogout = () => {
        logout();
    };

    const onConfirmDelete = () => {
        deleteMeeting(idRoom).unwrap().then((fulfilled) => {
            setIsOpen(false);
            setStatusAlert('success');
            setAlert(true)
            setMessageAlert('success delete meeting')
            reset();
            setTimeout(() => {
                setAlert(false);
                setMessageAlert('')
            }, 10000);
        }).catch((rejected) => {
            setStatusAlert('error');
            setAlert(true)
            setMessageAlert('failed delete meeting')
            setTimeout(() => {
                setAlert(false);
                setMessageAlert('')
            }, 10000);
        })
    }

    useEffect(() => {
        const fiveWeeks = 5 * 7;
        const sixWeeks = 6 * 7;
        const startOfMonth = Temporal.PlainDate.from({ year, month, day: 1 });
        const monthLength = startOfMonth.daysInMonth;
        const dayOfWeekMonthStartedOn = startOfMonth.dayOfWeek - 1;
        const length =
            dayOfWeekMonthStartedOn + monthLength > fiveWeeks ? sixWeeks : fiveWeeks;

        // Create blank array
        let calendar = new Array(length).fill({}).map((_, index) => {
            const date = startOfMonth.add({ days: index - dayOfWeekMonthStartedOn });
            return {
                isInMonth: !(index < dayOfWeekMonthStartedOn || index - dayOfWeekMonthStartedOn >= monthLength),
                date,
                meetings: [] as MeetingResponseData[],
            };
        });

        // Process meetings data
        // Process meetings data
        if (getMeetings?.data) {
            setAllMeetings(getMeetings.data);
            getMeetings.data.forEach((meeting) => {
                const [datePart, timePart] = meeting.start_time.split("T"); // Separate date & time
                const meetingDate = Temporal.PlainDate.from(datePart);
                const calendarDay = calendar.find((day) => day.date.equals(meetingDate));

                if (calendarDay) {
                    calendarDay.meetings.push(meeting);

                    // 🔹 Sort meetings by start_time
                    calendarDay.meetings.sort((a, b) => {
                        const timeA = Temporal.PlainTime.from(a.start_time.split("T")[1].replace("Z", ""));
                        const timeB = Temporal.PlainTime.from(b.start_time.split("T")[1].replace("Z", ""));
                        return Temporal.PlainTime.compare(timeA, timeB);
                    });
                }
            });
        }


        setMonthCalendar(calendar);
    }, [year, month, getMeetings]);

    return (
        <div className="flex max-h-screen">
            {/* Sidebar */}
            {showSidebar ?
                (
                    <div className={`fixed left-0 top-0 h-full bg-gray-900 p-4 w-80 transition-transform ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:w-64`}>
                        <h2 className="text-lg text-white font-semibold mb-4">All Meetings</h2>
                        <div className="overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                            {allMeetings.length > 0 ? (
                                allMeetings.map((meeting) => {
                                    const meetingDateTime = Temporal.Instant.from(meeting.start_time).toZonedDateTimeISO("UTC");
                                    const meetingDate = meetingDateTime.toPlainDateTime().toPlainDate().toString();
                                    const todayDate = today.toPlainDateTime().toPlainDate().toString();
                                    const tomorrowDate = today.add({ days: 1 }).toPlainDateTime().toPlainDate().toString();
                                    const initialComparedTime = Temporal.PlainDateTime.from(meeting.start_time.replace("Z", "")).toZonedDateTime("Asia/Jakarta");
                                    const now = Temporal.Now.zonedDateTimeISO("Asia/Jakarta");
                                    const isPastMeeting = Temporal.ZonedDateTime.compare(initialComparedTime, now) < 0;

                                    let dateLabel = meetingDate;
                                    if (meetingDate === todayDate) {
                                        dateLabel = "Today";
                                    } else if (meetingDate === tomorrowDate) {
                                        dateLabel = "Tomorrow";
                                    }

                                    return (
                                        <div
                                            key={meeting.ID}
                                            className={`mt-1 text-xs bg-blue-600 text-white p-1 rounded w-full text-center ${isPastMeeting ? "line-through bg-gray-600" : "cursor-pointer hover:bg-blue-700"}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Stop bubbling agar tidak trigger parent
                                                if (Temporal.PlainDate.compare(meetingDateTime.toPlainDate(), today) >= 0 && !isPastMeeting) {
                                                    handleMeetingClick({ id: meeting.zoom_id, topic: meeting.topic, start_time: meeting.start_time, selected_date: meetingDateTime.toPlainDate().toString() });
                                                }
                                            }}
                                        >
                                            <div>{meeting.topic}</div>
                                            <div className="ml-1">
                                                ({dateLabel} {meetingDateTime.toLocaleString("en", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: false,
                                                })})
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No meetings found.</p>
                            )}
                        </div>
                    </div>

                ) : (<></>)
            }
            {/* Main Calendar */}
            <div className="flex-grow flex flex-col max-h-screen p-4">
                <div className="flex justify-between mt-2 mb-8">
                    <button className="btn btn-gray w-[120px]" onClick={seeAllMeeting}>
                        {showSidebar ? "Close All Meeting" : "See All Meeting"}
                    </button>
                    <button className="btn btn-blue w-[120px]" onClick={previous}>
                        &lt; Previous
                    </button>
                    <h2 className="flex text-xl font-semibold">
                        {Temporal.PlainDate.from({ year, month, day: 1 }).toLocaleString("en", {
                            month: "long",
                            year: "numeric",
                        })}
                    </h2>
                    <button className="btn btn-blue w-[120px]" onClick={next}>
                        Next &gt;
                    </button>
                    <button className="btn btn-red w-[120px]" onClick={() => handleLogout()}>
                        Logout
                    </button>
                </div>
                {alert && <Alert status={statusAlert}>{messageAlert}</Alert>}
                <div className="grid grid-cols-7 gap-1 text-center font-semibold">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, index) => (
                        <div key={index}>{name}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-grow">
                    {monthCalendar.map((day, index) => (
                        <div
                            key={index}
                            className={`border border-slate-700 p-2 min-h-[80px] flex flex-col items-center ${day.isInMonth
                                ? Temporal.PlainDate.compare(day.date, today) < 0
                                    ? "bg-gray-900 text-white" // Past days in the current month → Green
                                    : Temporal.PlainDate.compare(day.date, today) === 0
                                        ? "bg-gray-700 font-light" // Today → Gray
                                        : "bg-black hover:bg-gray-800" // Future days → Black
                                : "bg-slate-500 hover:bg-slate-600 font-light text-slate-400" // Days outside the month → Slate
                                }`}
                            onClick={day.isInMonth && Temporal.PlainDate.compare(day.date, today) >= 0 ? () => handleDayClick(day.date.toString()) : () => { }}
                        >
                            <div className="flex items-center justify-center">
                                <div
                                    className={`text-lg font-bold flex items-center justify-center w-8 h-8 rounded-full ${Temporal.PlainDate.compare(day.date, today) === 0
                                        ? "text-white border-2 border-red-600"
                                        : "text-gray-200"}`}
                                >
                                    {day.date.day}
                                </div>
                            </div>
                            <div className="mt-1 w-full max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                                {day.meetings?.map((meeting) => {
                                    const meetingDateTime = Temporal.Instant.from(meeting.start_time).toZonedDateTimeISO("UTC");
                                    const initialComparedTime = Temporal.PlainDateTime.from(meeting.start_time.replace("Z", "")).toZonedDateTime("Asia/Jakarta");
                                    const now = Temporal.Now.zonedDateTimeISO("Asia/Jakarta");
                                    const isPastMeeting = Temporal.ZonedDateTime.compare(initialComparedTime, now) < 0;

                                    return (
                                        <div
                                            key={meeting.ID}
                                            className={`mt-1 text-xs bg-blue-600 text-white p-1 rounded w-full text-center ${isPastMeeting ? "line-through bg-gray-600" : "cursor-pointer hover:bg-blue-700"}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Stop bubbling agar tidak trigger parent
                                                if (day.isInMonth && Temporal.PlainDate.compare(day.date, today) >= 0 && !isPastMeeting) {
                                                    handleMeetingClick({ id: meeting.zoom_id, topic: meeting.topic, start_time: meeting.start_time, selected_date: day.date.toString() });
                                                }
                                            }}
                                        >
                                            <span>{meeting.topic}</span>
                                            <span className="ml-1">
                                                ({meetingDateTime.toLocaleString("en", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: false,
                                                })})
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Modal for Adding/Editing Meetings */}
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <MeetingDataContainer idRoom={idRoom} mode={mode} setValue={setValue}>
                    <div className="bg-black text-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            {mode === 'view' ? "View Meeting" : mode === 'add' ? "Add Meeting" : mode === 'edit' ? "Edit Meeting" : mode === 'delete' ? "Delete Meeting" : ""}
                        </h2>
                        {
                            mode === 'view' ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Meeting ID :</span>
                                        <span className="text-gray-300">{watchIdMeeting}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Topic :</span>
                                        <span className="text-gray-300">{watchTopic}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Start Time :</span>
                                        <span className="text-gray-300">{watchStartTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Link Meet :</span>
                                        <a href={watchJoinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 overflow-hidden text-ellipsis whitespace-nowrap block max-w-[200px]">
                                            {watchJoinUrl}
                                        </a>
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={deleteAction}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 border border-gray-500 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="button"
                                                onClick={toEditForm}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) :
                                mode === 'add' || mode === 'edit' ? (
                                    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                        }
                                    }}>
                                        {/* Meeting Name */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-300">Meeting Name</label>
                                            <Controller
                                                name="topic"
                                                control={control}
                                                rules={{ required: "Topic is required" }}
                                                render={({ field: { value, onChange, onBlur } }) => (
                                                    <input
                                                        type="text"
                                                        className="mt-1 p-2 w-full border border-gray-700 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-500"
                                                        required
                                                        autoFocus
                                                        value={value}
                                                        onBlur={onBlur}
                                                        onChange={onChange}
                                                    />
                                                )}
                                            />
                                            {errors.topic && <p className="text-red-400 text-sm">{errors.topic.message}</p>}
                                        </div>

                                        {/* Start Meeting Time */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-300">Start Meeting Time</label>
                                            <Controller
                                                name="start_time"
                                                control={control}
                                                rules={{
                                                    required: "Time is required",
                                                    validate: (value) => {
                                                        if (!selectedDate) return "Please select a date first!";

                                                        const now = new Date();
                                                        const [datePart, timePart] = value.split(" ");
                                                        const [hours, minutes] = timePart.split(":").map(Number);
                                                        const selectedDateTime = new Date(`${datePart}T${timePart}:00`);

                                                        return selectedDateTime >= now || "Cannot select past time!";
                                                    },
                                                }}
                                                render={({ field: { onChange, value }, fieldState: { error } }) => (
                                                    <div className="flex flex-col h-auto">
                                                        <TimePicker
                                                            onChange={(time) => {
                                                                if (time && selectedDate) {
                                                                    const formattedDateTime = `${selectedDate} ${time}`;

                                                                    // Prevent past times if today
                                                                    const now = new Date();
                                                                    const selectedDateTime = new Date(`${formattedDateTime}:00`);

                                                                    if (selectedDateTime < now) {
                                                                        setError("start_time", {
                                                                            type: "manual",
                                                                            message: "Cannot select past time!",
                                                                        });
                                                                    } else {
                                                                        clearErrors("start_time");
                                                                        onChange(formattedDateTime);
                                                                    }
                                                                }
                                                            }}
                                                            value={value?.split(" ")[1] || ""}
                                                            format="HH:mm"
                                                            className="border border-gray-300 rounded-md p-2 w-full text-gray-700"
                                                        />
                                                        {error && <p className="text-red-400 text-sm">{error.message}</p>}
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 border border-gray-500 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                                            >
                                                {mode === 'edit' ? ('Update') : ('Save')}
                                            </button>
                                        </div>
                                    </form>
                                ) : mode === 'delete' ? (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-96">
                                            <h2 className="text-xl font-semibold text-red-500">Delete Event</h2>
                                            <p className="mt-2 text-gray-300">Are you sure delete this event? <br />This action cannot be undone.</p>
                                            <div className="mt-4 flex justify-between gap-2">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={onConfirmDelete}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={backToView}
                                                        className="px-4 py-2 border border-gray-500 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (<></>)
                        }
                    </div>
                </MeetingDataContainer>
            </Modal>
        </div >
    );
}

export default Calendar;