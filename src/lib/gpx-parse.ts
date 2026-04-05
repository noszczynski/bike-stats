/**
 * Wyciąga punkty trasy z dokumentu GPX (obsługa prefiksów namespace przez localName).
 */
function collectPointsByLocalName(doc: Document | Element, localName: string): [number, number][] {
    const root = doc instanceof Document ? doc.documentElement : doc;
    const out: [number, number][] = [];
    const walk = (el: Element) => {
        for (const child of Array.from(el.children)) {
            if (child.localName === localName) {
                const lat = child.getAttribute("lat");
                const lon = child.getAttribute("lon");
                if (lat != null && lon != null) {
                    const la = Number.parseFloat(lat);
                    const lo = Number.parseFloat(lon);
                    if (!Number.isNaN(la) && !Number.isNaN(lo)) {
                        out.push([la, lo]);
                    }
                }
            }
            walk(child);
        }
    };
    walk(root);
    return out;
}

/**
 * Parsuje XML GPX do listy [lat, lng]. Najpierw segmenty `trkpt`, potem fallback `rtept`.
 */
export function parseGpxToLatLngs(xmlString: string): [number, number][] {
    const doc = new DOMParser().parseFromString(xmlString, "application/xml");
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
        throw new Error("Plik nie jest poprawnym XML.");
    }

    let points = collectPointsByLocalName(doc, "trkpt");
    if (points.length === 0) {
        points = collectPointsByLocalName(doc, "rtept");
    }

    if (points.length === 0) {
        throw new Error("Brak punktów trasy (trkpt/rtept) w pliku GPX.");
    }

    return points;
}
