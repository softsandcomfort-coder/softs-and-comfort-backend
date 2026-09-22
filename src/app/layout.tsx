import { ReactNode } from "react";
import { Albert_Sans } from "next/font/google";
import "@/scss/main.scss"
import ClientBootstrap from "@/components/common/ClientBootstrap";

const albertSans = Albert_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-main-family",
});

// The dashboard is private — keep every page out of search results.
export const metadata = {
    robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <ClientBootstrap />
            {/*
              * Browser extensions (ColorZilla, Grammarly, password managers…)
              * add attributes to <body> before React hydrates, which otherwise
              * logs a hydration mismatch the app cannot do anything about.
              */}
            <body className={albertSans.variable} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
