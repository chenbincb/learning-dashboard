import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "学情看板",
    description: "极简、硬核的成绩诊断与 PK 场",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
