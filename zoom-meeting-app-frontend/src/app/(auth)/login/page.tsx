import DarkModeToggle from '@/components/ui/DarkMode'
import { Form as LoginForm } from './form'

export default function LoginPage() {
    return (
        <div className="h-screen w-screen flex justify-center items-center bg-slate-100 dark:bg-gray-900">
            <div className="sm:shadow-xl px-8 pb-8 pt-12 sm:bg-white dark:sm:bg-gray-800 rounded-xl space-y-6">
                {/* Tombol Toggle Dark Mode */}
                <div className="absolute top-4 right-4">
                    <DarkModeToggle />
                </div>
                <h1 className="font-semibold text-2xl dark:text-white text-center">Login</h1>
                <LoginForm />
            </div>
        </div>
    )
}