"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChartExportActionsProps = {
    targetRef: React.RefObject<HTMLElement>;
    fileName: string;
    className?: string;
};

const buildPngBlob = async (target: HTMLElement) => {
    const svg = target.querySelector("svg");

    if (!svg) {
        throw new Error("Nie znaleziono wykresu do eksportu.");
    }

    const { width, height } = svg.getBoundingClientRect();
    const exportWidth = Math.max(1, Math.ceil(width));
    const exportHeight = Math.max(1, Math.ceil(height));

    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute("width", `${exportWidth}`);
    svgClone.setAttribute("height", `${exportHeight}`);

    if (!svgClone.getAttribute("viewBox")) {
        svgClone.setAttribute("viewBox", `0 0 ${exportWidth} ${exportHeight}`);
    }

    const inlineSvgStyles = (source: SVGSVGElement, targetSvg: SVGSVGElement) => {
        const sourceNodes = source.querySelectorAll<SVGElement>("*");
        const targetNodes = targetSvg.querySelectorAll<SVGElement>("*");

        sourceNodes.forEach((sourceNode, index) => {
            const targetNode = targetNodes[index];
            if (!targetNode) {
                return;
            }

            const computed = window.getComputedStyle(sourceNode);
            const styleParts = [
                `fill:${computed.fill}`,
                `stroke:${computed.stroke}`,
                `stroke-width:${computed.strokeWidth}`,
                `stroke-dasharray:${computed.strokeDasharray}`,
                `stroke-linecap:${computed.strokeLinecap}`,
                `stroke-linejoin:${computed.strokeLinejoin}`,
                `opacity:${computed.opacity}`,
                `font-family:${computed.fontFamily}`,
                `font-size:${computed.fontSize}`,
                `font-weight:${computed.fontWeight}`,
                `font-style:${computed.fontStyle}`,
                `letter-spacing:${computed.letterSpacing}`,
                `text-anchor:${computed.textAnchor}`,
            ];

            const existingStyle = targetNode.getAttribute("style");
            targetNode.setAttribute(
                "style",
                `${existingStyle ? `${existingStyle};` : ""}${styleParts.join(";")}`,
            );
        });
    };

    const chartContainer = target.querySelector("[data-slot='chart']") as HTMLElement | null;
    let backgroundColor = "#ffffff";
    if (chartContainer && typeof window !== "undefined") {
        const computedStyle = window.getComputedStyle(chartContainer);
        backgroundColor = computedStyle.backgroundColor || backgroundColor;
        const cssVars = Array.from(computedStyle)
            .filter(name => name.startsWith("--color-"))
            .map(name => `${name}:${computedStyle.getPropertyValue(name)}`)
            .join(";");

        if (cssVars.length > 0) {
            const existingStyle = svgClone.getAttribute("style");
            const styleSuffix = existingStyle ? `${existingStyle};` : "";
            svgClone.setAttribute("style", `${styleSuffix}${cssVars}`);
        }
    }

    inlineSvgStyles(svg, svgClone);

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgClone);

    if (!source.includes("xmlns=\"http://www.w3.org/2000/svg\"")) {
        source = source.replace(
            "<svg",
            "<svg xmlns=\"http://www.w3.org/2000/svg\"",
        );
    }

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
        const img = new Image();
        img.decoding = "async";

        const imageLoad = new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Nie udało się przygotować obrazu."));
        });

        img.src = url;

        const loadedImage = await imageLoad;
        const scale = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(exportWidth * scale);
        canvas.height = Math.ceil(exportHeight * scale);

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Nie udało się przygotować obrazu.");
        }

        context.scale(scale, scale);
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, exportWidth, exportHeight);
        context.drawImage(loadedImage, 0, 0, exportWidth, exportHeight);

        const pngBlob = await new Promise<Blob | null>(resolve => {
            canvas.toBlob(resolve, "image/png");
        });

        if (!pngBlob) {
            throw new Error("Nie udało się przygotować obrazu.");
        }

        return pngBlob;
    } finally {
        URL.revokeObjectURL(url);
    }
};

const sanitizeFileName = (name: string) =>
    name
        .replace(/[^a-z0-9-_.]+/gi, "-")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

export function ChartExportActions({ targetRef, fileName, className }: ChartExportActionsProps) {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleCopy = React.useCallback(async () => {
        if (isExporting) {
            return;
        }

        if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
            toast.error("Kopiowanie do schowka nie jest obsługiwane w tej przeglądarce.");
            return;
        }

        const target = targetRef.current;

        if (!target) {
            toast.error("Nie znaleziono wykresu do skopiowania.");
            return;
        }

        try {
            setIsExporting(true);
            const blob = await buildPngBlob(target);
            const clipboardItem = new window.ClipboardItem({ "image/png": blob });

            await navigator.clipboard.write([clipboardItem]);
            toast.success("Wykres skopiowany do schowka.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Nie udało się skopiować.";
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, targetRef]);

    const handleDownload = React.useCallback(async () => {
        if (isExporting) {
            return;
        }

        const target = targetRef.current;

        if (!target) {
            toast.error("Nie znaleziono wykresu do zapisania.");
            return;
        }

        try {
            setIsExporting(true);
            const blob = await buildPngBlob(target);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `${sanitizeFileName(fileName)}.png`;
            link.click();

            URL.revokeObjectURL(url);
            toast.success("Wykres zapisany jako PNG.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Nie udało się zapisać.";
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    }, [fileName, isExporting, targetRef]);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={isExporting}
                className="gap-1.5"
            >
                <Copy className="h-4 w-4" />
                Kopiuj
            </Button>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isExporting}
                className="gap-1.5"
            >
                <Download className="h-4 w-4" />
                Zapisz
            </Button>
        </div>
    );
}
