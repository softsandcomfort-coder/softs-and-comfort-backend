import { ReactNode } from "react";
import { Albert_Sans } from "next/font/google";
import "@/scss/main.scss"
import ClientBootstrap from "@/components/common/ClientBootstrap";

const albertSans = Albert_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-main-family",
});

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <ClientBootstrap />
            <body className={albertSans.variable}>{children}</body>
        </html>
    );
}
