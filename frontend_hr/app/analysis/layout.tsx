import { Geist, Geist_Mono } from "next/font/google";
import ".././globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Page({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <div>
            <header className="bg-primary text-primary-foreground p-4 shadow-md">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold">HR Resume Analysis Portal</h1>
                </div>
            </header>
            <div
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </div>
        </div>
    );
}