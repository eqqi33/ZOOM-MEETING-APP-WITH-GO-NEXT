import { createContext, ReactNode, useEffect, useState } from "react"
import { AuthValuesType, ErrCallbackType, LoginParams, UserDataType } from "./type"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AuthLogin, AuthLogout, AuthMe } from "@/service/auth"
import { AxiosResponse } from "axios"
import { AuthLogoutResponse, AuthMeResponse, AuthResponse } from "@/types/servicesTypes"
import apiConfig from '@/configs/api';

// ** Defaults
const defaultProvider: AuthValuesType = {
    user: null,
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
}

const AuthContext = createContext(defaultProvider)

type Props = {
    children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
    // ** States
    // ** States
    const [user, setUser] = useState<UserDataType | null>(defaultProvider.user)
    // ** Hooks
    const router = useRouter()
    const pathname = usePathname();
    const searchParams = useSearchParams();
    useEffect(() => {
        const initAuth = async (): Promise<void> => {
            await AuthMe()
                .then((response: AxiosResponse<AuthMeResponse>) => {
                    setUser(response?.data?.data);
                })
                .catch(async (error) => {
                    localStorage.removeItem(apiConfig.auth.userKeyName);
                    localStorage.removeItem(apiConfig.auth.refreshTokenKeyName);
                    localStorage.removeItem(apiConfig.auth.storageTokenKeyName);
                    setUser(null);
                    if (
                        apiConfig.auth.onTokenExpiration === 'logout' &&
                        !pathname.includes('login')
                    ) {
                        setTimeout(() => {
                            router.replace("/login");
                        }, 0);
                        // setTimeout(() => {
                        //     redirect("/login");
                        // }, 0);
                    }
                });
        }

        initAuth()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleLogin = async (params: LoginParams, errorCallback?: ErrCallbackType) => {
        await AuthLogin(params)
            .then((response: AxiosResponse<AuthResponse>) => {
                if (response?.data?.data?.accessToken != null) {
                    window.localStorage.setItem(
                        apiConfig.auth.storageTokenKeyName,
                        response.data.data.accessToken,
                    );
                    const returnUrl = searchParams.get('returnUrl');
                    setUser({ ...response?.data?.data?.user });
                    window.localStorage.setItem(
                        apiConfig.auth.userKeyName,
                        JSON.stringify(response?.data?.data?.user),
                    );

                    const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/';

                    // router.replace(redirectURL as string);

                    window.location.href = "http://localhost:8000/auth/zoom?accessToken="+response.data.data.accessToken;
                }
            })
            .catch((err: any) => {
                if (errorCallback) {
                    errorCallback(err);
                }
            });
    }

    const handleLogout = async (): Promise<void> => {
        await AuthLogout().then((response: AxiosResponse<AuthLogoutResponse>) => {
            setUser(null);
            window.localStorage.removeItem(apiConfig.auth.userKeyName);
            window.localStorage.removeItem(apiConfig.auth.storageTokenKeyName);
            router.push('/login');
        });
    }

    const values = {
        user,
        login: handleLogin,
        logout: handleLogout
    }

    return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }