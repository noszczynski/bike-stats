import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

/**
 * The different types of metrics that can be tracked
 */
export type MetricType = 'distance' | 'elevation' | 'speed' | 'maxSpeed' | 'heartRate' | 'time' | 'timePerKm';

/**
 * Format a trend percentage with a sign
 */
export const formatTrend = (trend: number): string => {
    return `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
};

/**
 * Determine if a positive change is considered an improvement for a given metric type
 */
export const isPositiveImprovement = (metricType: MetricType): boolean => {
    switch (metricType) {
        case 'heartRate':
        case 'timePerKm':
            // For these metrics, lower is better
            return false;
        default:
            // For all other metrics, higher is better
            return true;
    }
};

/**
 * Determine if a trend represents an improvement based on the metric type
 */
export const isImprovement = (trend: number, metricTypeOrPositiveIsBetter: MetricType | boolean): boolean => {
    const isPositive = trend > 0;

    if (typeof metricTypeOrPositiveIsBetter === 'boolean') {
        // Backward compatibility with boolean parameter
        const positiveIsBetter = metricTypeOrPositiveIsBetter;

        return (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);
    }

    // Use the metric type to determine if positive change is better
    const positiveIsBetter = isPositiveImprovement(metricTypeOrPositiveIsBetter);

    return (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);
};

/**
 * Determine if a trend represents progress, regress, or no change based on the metric type
 */
export const getTrendProgress = (
    trend: number,
    metricType: MetricType | boolean = true
): 'progress' | 'regress' | 'neutral' => {
    if (trend === 0) return 'neutral';

    return isImprovement(trend, metricType) ? 'progress' : 'regress';
};

/**
 * Generate a human-readable message about a trend based on its magnitude and direction
 */
export const getTrendMessage = (trend: number, metricTypeOrPositiveIsBetter: MetricType | boolean = true): string => {
    const absValue = Math.abs(trend);
    if (absValue === 0) return 'Bez zmian';

    const improved = isImprovement(trend, metricTypeOrPositiveIsBetter);
    const isSpeechMetric =
        typeof metricTypeOrPositiveIsBetter !== 'boolean' &&
        (metricTypeOrPositiveIsBetter === 'heartRate' || metricTypeOrPositiveIsBetter === 'timePerKm');

    // Special wording for heart rate and timePerKm (using "spadek/wzrost" instead of "poprawa/spadek")
    if (isSpeechMetric) {
        if (absValue <= 10) {
            return improved ? 'Niewielki spadek' : 'Niewielki wzrost';
        } else if (absValue <= 25) {
            return improved ? 'Umiarkowany spadek' : 'Umiarkowany wzrost';
        } else if (absValue <= 75) {
            return improved ? 'Znaczny spadek' : 'Znaczny wzrost';
        } else {
            return improved ? 'Spektakularny spadek' : 'Nipokojący wzrost';
        }
    }

    // Standard wording for other metrics
    if (absValue <= 10) {
        return improved ? 'Niewielka poprawa' : 'Niewielki spadek';
    } else if (absValue <= 25) {
        return improved ? 'Umiarkowana poprawa' : 'Umiarkowany spadek';
    } else if (absValue <= 75) {
        return improved ? 'Znaczna poprawa' : 'Znaczny spadek';
    } else {
        return improved ? 'Spektakularna poprawa' : 'Spektakularny spadek';
    }
};

/**
 * Determine which icon to show for a trend based on its direction and metric type
 */
export const getTrendIcon = (trend: number, metricTypeOrPositiveIsBetter: MetricType | boolean = true) => {
    if (trend === 0) return undefined;

    const improved = isImprovement(trend, metricTypeOrPositiveIsBetter);

    // For metrics that involve direction (up/down), we need to consider the visual representation
    const isUpIcon =
        typeof metricTypeOrPositiveIsBetter !== 'boolean' && metricTypeOrPositiveIsBetter === 'timePerKm'
            ? !improved
            : improved;

    return isUpIcon ? TrendingUpIcon : TrendingDownIcon;
};
