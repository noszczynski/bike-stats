import type { ReactNode } from "react";

/**
 * Pełna szerokość i wysokość obszaru treści obok sidebara — usuwa padding rodzica z dashboard layoutu tylko dla `/gpx`.
 */
export default function GpxLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="-mx-4 -mt-4 -mb-4 flex min-h-0 flex-1 flex-col md:-mx-6 md:-mt-6 md:-mb-6">
            {children}
        </div>
    );
}
