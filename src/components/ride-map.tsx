import "leaflet/dist/leaflet.css";

import polyline from "polyline";
import { Polyline as LeafletPolyline, MapContainer, TileLayer } from "react-leaflet";

interface RideMapProps {
    summaryPolyline: string;
}

export function RideMap({ summaryPolyline }: RideMapProps) {
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
    // Calculate bounds and center
    const latLngs: [number, number][] = positions.map(([lat, lng]: [number, number]) => [lat, lng]);

    // Calculate bounds
    const maxLat = Math.max(...latLngs.map(([lat]) => lat));
    const minLat = Math.min(...latLngs.map(([lat]) => lat));
    const maxLng = Math.max(...latLngs.map(([, lng]) => lng));
    const minLng = Math.min(...latLngs.map(([, lng]) => lng));

    // Add padding to bounds (about 10% on each side)
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    const bounds: [[number, number], [number, number]] = [
        [minLat - latPadding, minLng - lngPadding], // Southwest corner
        [maxLat + latPadding, maxLng + lngPadding], // Northeast corner
    ];

    return (
        <div className="mt-6 flex w-full justify-center">
            <div className="relative w-full overflow-hidden rounded-lg border">
                <div className="pb-[56.25%]" /> {/* 16:9 aspect ratio */}
                <div className="absolute inset-0">
                    <MapContainer
                        bounds={bounds}
                        scrollWheelZoom={false}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LeafletPolyline
                            positions={latLngs}
                            pathOptions={{ color: "blue", weight: 4 }}
                        />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
