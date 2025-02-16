'use client'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

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
    const router = useRouter()
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
        auth.login({ email, password }, (callback) => {
            setError('email', {
                type: 'manual',
                message: 'Email or Password is invalid'
            })
        })
    }

    return (
        <form noValidate autoComplete='off' className="space-y-12 w-full sm:w-[400px]" onSubmit={handleSubmit(onSubmit)} >
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Controller
                    name='email'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange, onBlur } }) => (
                        <Input
                            type="email"
                            className="w-full"
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
                <Label htmlFor="email">Password</Label>
                <Controller
                    name='password'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange, onBlur } }) => (
                        <Input
                            type="password"
                            className="w-full"
                            required
                            autoFocus
                            value={value}
                            onBlur={onBlur}
                            onChange={onChange}
                        />
                    )}
                />
                {errors.password && <Alert>{errors.password.message}</Alert>}
            </div>
            <div className="w-full">
                <Button className="w-full" size="lg">
                    Login
                </Button>
            </div>
        </form>
    )
}