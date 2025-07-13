'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/use-auth-mutations';

const loginSchema = z.object({
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const router = useRouter();
    const loginMutation = useLogin();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    async function onSubmit(data: LoginFormValues) {
        try {
            await loginMutation.mutateAsync(data);
            // Redirect to dashboard or home page after successful login
            router.push('/');
        } catch (error) {
            console.error('Login error:', error);
            // You might want to show an error message to the user here
        }
    }

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className='text-2xl'>Logowanie</CardTitle>
                    <CardDescription>Wprowadź swój email, aby zalogować się na konto</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                            <FormField
                                control={form.control}
                                name='email'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder='m@przykład.pl' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='password'
                                render={({ field }) => (
                                    <FormItem>
                                        <div className='flex items-center'>
                                            <FormLabel>Hasło</FormLabel>
                                            <Link
                                                href='/forgot-password'
                                                className='ml-auto inline-block text-sm underline-offset-4 hover:underline'>
                                                Zapomniałeś hasła?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input type='password' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type='submit' className='w-full' disabled={loginMutation.isPending}>
                                {loginMutation.isPending ? 'Logowanie...' : 'Zaloguj się'}
                            </Button>
                            <div className='mt-4 text-center text-sm'>
                                Nie masz konta?{' '}
                                <Link href='/register' className='underline underline-offset-4'>
                                    Zarejestruj się
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
