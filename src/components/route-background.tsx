import polyline from "polyline";

interface RouteBackgroundProps {
    summaryPolyline: string;
}

export function RouteBackground({ summaryPolyline }: RouteBackgroundProps) {
    // First, decode percent-encoding (e.g. from URLs)
    let cleanPolyline = summaryPolyline;
    try {
        cleanPolyline = decodeURIComponent(cleanPolyline);
    } catch (e) {
        // If already decoded, ignore
    }
    // Then, unescape any double backslashes (\\ -> \)
    cleanPolyline = cleanPolyline.replace(/\\/g, "\\");
    // Decode the polyline to an array of [lat, lng] pairs
    const positionsRaw = polyline.decode(cleanPolyline);
    // Filter to ensure only [number, number] pairs
    const positions: [number, number][] = positionsRaw.filter(
        (pt: number[]) => pt.length === 2,
    ) as [number, number][];

    // Calculate bounds
    const maxLat = Math.max(...positions.map(([lat]) => lat));
    const minLat = Math.min(...positions.map(([lat]) => lat));
    const maxLng = Math.max(...positions.map(([, lng]) => lng));
    const minLng = Math.min(...positions.map(([, lng]) => lng));

    // Calculate dimensions and aspect ratio
    const width = maxLng - minLng;
    const height = maxLat - minLat;
    const aspectRatio = width / height;

    // Set viewport dimensions based on aspect ratio
    const viewportWidth = aspectRatio > 1 ? 100 : 100 * aspectRatio;
    const viewportHeight = aspectRatio > 1 ? 100 / aspectRatio : 100;

    // Scale points to fit the viewport while maintaining aspect ratio
    const scaledPoints = positions.map(([lat, lng]) => {
        const x = ((lng - minLng) / width) * viewportWidth;
        const y = viewportHeight - ((lat - minLat) / height) * viewportHeight; // Invert y-axis

        return `${x},${y}`;
    });

    return (
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5">
            <svg
                viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="h-[90%] w-[90%]"
            >
                <polyline
                    points={scaledPoints.join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
}
