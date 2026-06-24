import { type ReactNode } from "react";







const AuthLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="grid grid-cols-12 overflow-auto sm:h-screen">
            <div className="relative hidden bg-[#FFE9D1] lg:col-span-7 lg:block xl:col-span-8 2xl:col-span-9 dark:bg-[#14181c]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/images/auth/hero-C-dashboard.svg" className="object-cover" alt="Auth Image" />
                </div>
            </div>
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 2xl:col-span-3">{children}</div>
        </div>
    );
};

export default AuthLayout;
