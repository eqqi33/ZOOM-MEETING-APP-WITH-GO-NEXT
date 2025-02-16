"use client"; // Pastikan ini ada

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: ReactNode }) {
    return <Provider store={store}>
        <AuthProvider>{children}</AuthProvider>
    </Provider>;
}
