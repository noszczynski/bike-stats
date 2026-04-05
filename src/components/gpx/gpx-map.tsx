"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import L, { type LatLngExpression } from "leaflet";
import { useTheme } from "next-themes";
import {
    CircleMarker,
    MapContainer,
    Marker,
    Polyline as LeafletPolyline,
    TileLayer,
    useMap,
} from "react-leaflet";

const DEFAULT_CENTER: LatLngExpression = [52.0693, 19.4803];
const DEFAULT_ZOOM = 6;
const TRACK_COLOR = "#2563eb";
const TRACK_ARROW_TARGET_COUNT = 14;
const TRACK_ARROW_MIN_SPACING_METERS = 150;
const TRACK_ARROW_MAX_SPACING_METERS = 1000;
const LIGHT_TILE_LAYER = {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
};
const DARK_TILE_LAYER = {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};
const FINISH_ICON = L.divIcon({
    className: "",
    html: `
        <div style="position: relative; width: 18px; height: 18px;">
            <div style="position: absolute; left: 3px; top: 1px; width: 2px; height: 16px; background: #1f2937; border-radius: 9999px;"></div>
            <svg width="14" height="10" viewBox="0 0 14 10" xmlns="http://www.w3.org/2000/svg" style="position: absolute; left: 5px; top: 1px; overflow: visible;">
                <rect width="14" height="10" rx="1.5" fill="#ffffff" stroke="#111827" stroke-width="0.75" />
                <rect x="0.75" y="0.75" width="3.125" height="4.25" fill="#111827" />
                <rect x="7" y="0.75" width="3.125" height="4.25" fill="#111827" />
                <rect x="3.875" y="5" width="3.125" height="4.25" fill="#111827" />
                <rect x="10.125" y="5" width="3.125" height="4.25" fill="#111827" />
            </svg>
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [4, 16],
});

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function getBearingDegrees(from: L.LatLng, to: L.LatLng) {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function createDirectionArrowIcon(rotation: number) {
    return L.divIcon({
        className: "",
        html: `
            <div style="display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; transform: rotate(${rotation.toFixed(1)}deg);">
                <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="overflow: visible;">
                    <path d="M6 1L10.25 10.5L6.85 8.25H5.15L1.75 10.5L6 1Z" fill="${TRACK_COLOR}" stroke="#ffffff" stroke-width="0.9" stroke-linejoin="round" />
                </svg>
            </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    });
}

function getDirectionArrows(positions: LatLngExpression[]) {
    if (positions.length < 2) {
        return [];
    }

    const points = positions.map((position) => L.latLng(position));
    let totalDistance = 0;

    for (let i = 1; i < points.length; i += 1) {
        totalDistance += points[i - 1].distanceTo(points[i]);
    }

    if (totalDistance < TRACK_ARROW_MIN_SPACING_METERS) {
        return [];
    }

    const spacing = clamp(
        totalDistance / TRACK_ARROW_TARGET_COUNT,
        TRACK_ARROW_MIN_SPACING_METERS,
        TRACK_ARROW_MAX_SPACING_METERS,
    );

    const arrows: Array<{ key: string; position: LatLngExpression; rotation: number }> = [];
    let nextArrowDistance = spacing / 2;
    let traversedDistance = 0;

    for (let i = 1; i < points.length; i += 1) {
        const start = points[i - 1];
        const end = points[i];
        const segmentDistance = start.distanceTo(end);

        if (segmentDistance === 0) {
            continue;
        }

        const rotation = getBearingDegrees(start, end);

        while (traversedDistance + segmentDistance >= nextArrowDistance) {
            const distanceOnSegment = nextArrowDistance - traversedDistance;
            const ratio = distanceOnSegment / segmentDistance;
            const position: LatLngExpression = [
                start.lat + (end.lat - start.lat) * ratio,
                start.lng + (end.lng - start.lng) * ratio,
            ];

            arrows.push({
                key: `${i}-${nextArrowDistance.toFixed(0)}`,
                position,
                rotation,
            });

            nextArrowDistance += spacing;
        }

        traversedDistance += segmentDistance;
    }

    return arrows;
}

function FitTrackBounds({ positions }: { positions: LatLngExpression[] }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length === 0) {
            return;
        }

        const bounds = L.latLngBounds(positions);
        if (!bounds.isValid()) {
            return;
        }

        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
    }, [map, positions]);

    return null;
}

interface GpxMapProps {
    positions: LatLngExpression[];
}

export function GpxMap({ positions }: GpxMapProps) {
    const { resolvedTheme } = useTheme();
    const hasTrack = positions.length > 0;
    const startPosition = hasTrack ? positions[0] : null;
    const endPosition = positions.length > 1 ? positions[positions.length - 1] : null;
    const directionArrows = useMemo(() => getDirectionArrows(positions), [positions]);
    const tileLayer = resolvedTheme === "dark" ? DARK_TILE_LAYER : LIGHT_TILE_LAYER;

    return (
        <div className="relative min-h-0 w-full flex-1">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom
                className="z-0 size-full"
                style={{ height: "100%", width: "100%", minHeight: "320px" }}
            >
                <TileLayer
                    key={tileLayer.url}
                    url={tileLayer.url}
                    attribution={tileLayer.attribution}
                />
                {hasTrack ? (
                    <>
                        <LeafletPolyline
                            positions={positions}
                            pathOptions={{ color: TRACK_COLOR, weight: 4 }}
                        />
                        {directionArrows.map((arrow) => (
                            <Marker
                                key={arrow.key}
                                position={arrow.position}
                                icon={createDirectionArrowIcon(arrow.rotation)}
                                interactive={false}
                                keyboard={false}
                            />
                        ))}
                        {startPosition ? (
                            <CircleMarker
                                center={startPosition}
                                radius={7}
                                pathOptions={{
                                    color: "#ffffff",
                                    fillColor: "#22c55e",
                                    fillOpacity: 1,
                                    opacity: 1,
                                    weight: 3,
                                }}
                            />
                        ) : null}
                        {endPosition ? <Marker position={endPosition} icon={FINISH_ICON} /> : null}
                        <FitTrackBounds positions={positions} />
                    </>
                ) : null}
            </MapContainer>
        </div>
    );
}
