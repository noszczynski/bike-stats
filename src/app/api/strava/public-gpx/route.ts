import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const activityId = request.nextUrl.searchParams.get("activity_id")?.trim();

    if (!activityId || !/^\d+$/.test(activityId)) {
        return NextResponse.json(
            { error: "Parameter activity_id musi być liczbą." },
            { status: 400 },
        );
    }

    try {
        const response = await fetch(
            `https://www.strava.com/activities/${activityId}/export_gpx`,
            {
                headers: {
                    Accept: "application/gpx+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
                },
                redirect: "follow",
            },
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Strava zwróciła status ${response.status} dla export_gpx.` },
                { status: response.status },
            );
        }

        const gpxXml = await response.text();

        if (!gpxXml.includes("<gpx")) {
            return NextResponse.json(
                { error: "Odpowiedź ze Stravy nie wygląda jak poprawny plik GPX." },
                { status: 502 },
            );
        }

        return new NextResponse(gpxXml, {
            status: 200,
            headers: {
                "Content-Type": "application/gpx+xml; charset=utf-8",
            },
        });
    } catch (error) {
        console.error("Error fetching public Strava GPX:", error);

        return NextResponse.json(
            { error: "Nie udało się pobrać publicznego GPX ze Stravy." },
            { status: 500 },
        );
    }
}
