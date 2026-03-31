import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Jazdy | Bike Stats",
    description: "Szczegółowe informacje o jazdach rowerowych",
};

export default function RidesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div className="w-full">{children}</div>;
}
