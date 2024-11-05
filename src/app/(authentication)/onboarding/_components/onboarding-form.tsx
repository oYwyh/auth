'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TOnBoardingSchema, onBoardingSchema } from "@/app/(authentication)/auth.types"
import { onBoarding } from "@/app/(authentication)/auth.actions"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { changePassword } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { getUserProvider } from "@/app/actions/index.actions"

export default function OnboardingForm({ setTrigger }: { setTrigger: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data: session, isLoading: isPending } = useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const { data } = await getSession();
            return data;
        }
    });

    const { data: provider, isLoading: isProviderLoading } = useQuery({
        queryKey: ['provider', session?.user?.id], // Include session user id in the query key
        queryFn: async () => {
            if (!session) return;
            const { provider } = await getUserProvider(session.user.id);
            return provider;
        },
        enabled: !!session
    });

    const form = useForm<TOnBoardingSchema>({
        resolver: zodResolver(onBoardingSchema),
        defaultValues: {
            name: '',
            username: '',
            bio: '',
        }
    })

    const onSubmit = async (data: TOnBoardingSchema) => {
        setIsLoading(true)
        if (!session) return;

        const result = await onBoarding({
            ...data,
            email: session.user.email,
            userId: session.user.id,
        })

        if (result && result.error) {
            setIsLoading(false)
            toast({
                title: result.error,
                variant: 'destructive'
            })
            return;
        }

        if (provider == 'credential') {
            const pwd = await changePassword({
                newPassword: data.password,
                currentPassword: 'password',
                revokeOtherSessions: true,
            });

            if (!pwd.data) {
                setIsLoading(false)
                throw new Error(pwd.error.message)
            };
        }

        if (result && result.updated) {
            setIsLoading(false)
            setTrigger(true)
            await queryClient.invalidateQueries({ queryKey: ['session'] })
            redirect("/")
        }
    }

    if (isPending || isProviderLoading) return;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="ywyh" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        disabled
                        defaultValue={session?.user.email}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="ywyher" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Bio <span className="text-gray-500">(optional)</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Something..." {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className={`${provider == 'oauth' && 'hidden'} flex flex-row gap-2`}>
                    <FormField
                        control={form.control}
                        name="password"
                        defaultValue={provider != 'credential' ? 'password' : ''}
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        defaultValue={provider != 'credential' ? 'password' : ''}
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Confirm Password"</FormLabel>
                                <FormControl>
                                    <Input {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button
                    type="submit"
                    className="w-full bg-[#E4E4E7] text-black hover:bg-white"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                        </svg>
                    ) : (
                        "Save"
                    )}
                </Button>
            </form>
        </Form>
    )
}