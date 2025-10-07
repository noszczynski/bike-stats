declare module "fit-file-parser" {
    interface FitParserOptions {
        force?: boolean;
        speedUnit?: "ms" | "kmh" | "mph";
        lengthUnit?: "m" | "km" | "mi";
        temperatureUnit?: "celsius" | "fahrenheit";
        elapsedTimestampUnit?: "s" | "ms";
    }

    interface FitRecord {
        timestamp: string | Date;
        position_lat?: number;
        position_long?: number;
        altitude?: number;
        distance?: number;
        speed?: number;
        heart_rate?: number;
        cadence?: number;
        temperature?: number;
        [key: string]: any;
    }

    interface FitLap {
        timestamp: string | Date;
        start_time?: string | Date;
        total_timer_time?: number;
        total_elapsed_time?: number;
        total_distance?: number;
        avg_speed?: number;
        max_speed?: number;
        avg_heart_rate?: number;
        max_heart_rate?: number;
        avg_cadence?: number;
        max_cadence?: number;
        total_ascent?: number;
        start_position_lat?: number;
        start_position_long?: number;
        end_position_lat?: number;
        end_position_long?: number;
        [key: string]: any;
    }

    interface FitSession {
        start_time: string | Date;
        total_timer_time?: number;
        total_elapsed_time?: number;
        total_distance?: number;
        avg_speed?: number;
        max_speed?: number;
        avg_heart_rate?: number;
        max_heart_rate?: number;
        total_ascent?: number;
        sport?: string;
        device_info?: {
            product_name?: string;
            [key: string]: any;
        };
        [key: string]: any;
    }

    interface FitActivity {
        timestamp: string | Date;
        [key: string]: any;
    }

    interface FitParseResult {
        activity?: FitActivity;
        sessions?: FitSession[];
        records?: FitRecord[];
        laps?: FitLap[];
        [key: string]: any;
    }

    class FitParser {
        constructor(options?: FitParserOptions);
        parse(buffer: Buffer, callback: (error: any, result: FitParseResult) => void): void;
    }

    export = FitParser;
}
