'use client'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

const schema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().min(8).required()
})

const defaultValues = {
    password: '',
    email: ''
}

interface FormData {
    email: string
    password: string
}

export const Form = () => {
    // ** Hooks
    const auth = useAuth()
    const {
        control,
        setError,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues,
        mode: 'onBlur',
        resolver: yupResolver(schema)
    });

    const onSubmit = (data: FormData) => {
        const { email, password } = data
        auth.login({ email, password }, () => {
            setError('email', {
                type: 'manual',
                message: 'Email or Password is invalid'
            })
        })
    }

    return (
        <form noValidate autoComplete='off' className="space-y-12 w-full sm:w-[400px]" onSubmit={handleSubmit(onSubmit)} >
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email" className="dark:text-white">Email</Label>
                <Controller
                    name='email'
                    control={control}
                    rules={{ required: "Email is required" }}
                    render={({ field: { value, onChange, onBlur } }) => (
                        <Input
                            type="email"
                            className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                            autoFocus
                            value={value}
                            onBlur={onBlur}
                            onChange={onChange}
                            placeholder='admin@admin.com'
                        />
                    )}
                />
                {errors.email && <Alert>{errors.email.message}</Alert>}

                <Label htmlFor="password" className="dark:text-white  gap-1.5">Password</Label>
                <Controller
                    name='password'
                    control={control}
                    rules={{ required: "Password is required" }}
                    render={({ field: { value, onChange, onBlur } }) => (
                        <Input
                            type="password"
                            className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                            value={value}
                            onBlur={onBlur}
                            onChange={onChange}
                        />
                    )}
                />
                {errors.password && <Alert>{errors.password.message}</Alert>}
            </div>
            <div className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" size="lg">
                    Login
                </Button>
            </div>
        </form>
    )
}