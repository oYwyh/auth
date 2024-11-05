import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
            <div className="relative hidden md:block">
                <Image
                    src={'/images/auth.jpg'}
                    alt="auth"
                    layout="fill"
                    objectFit="cover"
                    priority
                />
            </div>
            <div className="flex items-center justify-center bg-black p-8">
                <div className="w-full max-w-sm space-y-4">
                    {children}
                </div>
            </div>
        </div>
    )
}