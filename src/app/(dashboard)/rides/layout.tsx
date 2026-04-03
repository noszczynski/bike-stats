import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Aktywności | Bike Stats",
    description: "Szczegółowe informacje o jazdach rowerowych",
};

export default function RidesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div className="w-full">{children}</div>;
}
