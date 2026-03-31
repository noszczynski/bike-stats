import Link from "next/link";

export default function RideNotFound() {
    return (
        <div className="container flex flex-col items-center justify-center py-32">
            <h1 className="mb-4 text-4xl font-bold">Nie znaleziono jazdy</h1>
            <p className="text-muted-foreground mb-8">
                Jazda o podanym identyfikatorze nie istnieje.
            </p>
            <Link
                href="/"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
            >
                Wróć do strony głównej
            </Link>
        </div>
    );
}
