import {
    formatTrend,
    getTrendIcon,
    getTrendMessage,
    getTrendProgress,
    isImprovement,
    isPositiveImprovement
} from './trend-utils';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';

describe('Trend Utils', () => {
    describe('formatTrend', () => {
        it('should format positive trends with a plus sign', () => {
            expect(formatTrend(10.123)).toBe('+10.1%');
            expect(formatTrend(0)).toBe('+0.0%');
        });

        it('should format negative trends with a minus sign', () => {
            expect(formatTrend(-5.678)).toBe('-5.7%');
        });
    });

    describe('isPositiveImprovement', () => {
        it('should return false for metrics where lower is better', () => {
            expect(isPositiveImprovement('heartRate')).toBe(false);
            expect(isPositiveImprovement('timePerKm')).toBe(false);
        });

        it('should return true for metrics where higher is better', () => {
            expect(isPositiveImprovement('distance')).toBe(true);
            expect(isPositiveImprovement('elevation')).toBe(true);
            expect(isPositiveImprovement('speed')).toBe(true);
            expect(isPositiveImprovement('maxSpeed')).toBe(true);
            expect(isPositiveImprovement('time')).toBe(true);
        });
    });

    describe('isImprovement', () => {
        it('should handle boolean positiveIsBetter parameter', () => {
            // When positiveIsBetter is true, positive trends are improvements
            expect(isImprovement(10, true)).toBe(true);
            expect(isImprovement(-10, true)).toBe(false);

            // When positiveIsBetter is false, negative trends are improvements
            expect(isImprovement(10, false)).toBe(false);
            expect(isImprovement(-10, false)).toBe(true);
        });

        it('should handle metric types correctly', () => {
            // For most metrics, positive trends are improvements
            expect(isImprovement(10, 'distance')).toBe(true);
            expect(isImprovement(-10, 'distance')).toBe(false);

            // For heartRate and timePerKm, negative trends are improvements
            expect(isImprovement(10, 'heartRate')).toBe(false);
            expect(isImprovement(-10, 'heartRate')).toBe(true);

            expect(isImprovement(10, 'timePerKm')).toBe(false);
            expect(isImprovement(-10, 'timePerKm')).toBe(true);
        });
    });

    describe('getTrendProgress', () => {
        it('should return neutral for zero trends', () => {
            expect(getTrendProgress(0, 'distance')).toBe('neutral');
            expect(getTrendProgress(0, 'heartRate')).toBe('neutral');
        });

        it('should return progress or regress based on the trend and metric type', () => {
            // For standard metrics where higher is better
            expect(getTrendProgress(10, 'distance')).toBe('progress');
            expect(getTrendProgress(-10, 'distance')).toBe('regress');

            // For metrics where lower is better
            expect(getTrendProgress(10, 'heartRate')).toBe('regress');
            expect(getTrendProgress(-10, 'heartRate')).toBe('progress');
        });
    });

    describe('getTrendMessage', () => {
        it('should return "Bez zmian" for zero trends', () => {
            expect(getTrendMessage(0, 'distance')).toBe('Bez zmian');
        });

        it('should generate appropriate messages for standard metrics', () => {
            // Small positive change
            expect(getTrendMessage(5, 'distance')).toBe('Niewielka poprawa');
            // Moderate positive change
            expect(getTrendMessage(20, 'distance')).toBe('Umiarkowana poprawa');
            // Significant positive change
            expect(getTrendMessage(50, 'distance')).toBe('Znaczna poprawa');
            // Very large positive change
            expect(getTrendMessage(100, 'distance')).toBe('Spektakularna poprawa');

            // Small negative change
            expect(getTrendMessage(-5, 'distance')).toBe('Niewielki spadek');
            // Moderate negative change
            expect(getTrendMessage(-20, 'distance')).toBe('Umiarkowany spadek');
            // Significant negative change
            expect(getTrendMessage(-50, 'distance')).toBe('Znaczny spadek');
            // Very large negative change
            expect(getTrendMessage(-100, 'distance')).toBe('Spektakularny spadek');
        });

        it('should generate appropriate messages for heart rate and timePerKm', () => {
            // Small decrease (improvement) in heart rate
            expect(getTrendMessage(-5, 'heartRate')).toBe('Niewielki spadek');
            // Moderate decrease (improvement) in heart rate
            expect(getTrendMessage(-20, 'heartRate')).toBe('Umiarkowany spadek');

            // Small increase (regression) in heart rate
            expect(getTrendMessage(5, 'heartRate')).toBe('Niewielki wzrost');
            // Moderate increase (regression) in heart rate
            expect(getTrendMessage(20, 'heartRate')).toBe('Umiarkowany wzrost');

            // The same logic applies to timePerKm
            expect(getTrendMessage(-5, 'timePerKm')).toBe('Niewielki spadek');
            expect(getTrendMessage(5, 'timePerKm')).toBe('Niewielki wzrost');
        });
    });

    describe('getTrendIcon', () => {
        it('should return undefined for zero trends', () => {
            expect(getTrendIcon(0, 'distance')).toBe(undefined);
            expect(getTrendIcon(0, 'heartRate')).toBe(undefined);
        });

        it('should return TrendingUpIcon for improvements in standard metrics', () => {
            // For most metrics, positive trends should show up arrow
            expect(getTrendIcon(10, 'distance')).toBe(TrendingUpIcon);
            expect(getTrendIcon(10, 'elevation')).toBe(TrendingUpIcon);
            expect(getTrendIcon(10, 'speed')).toBe(TrendingUpIcon);
            expect(getTrendIcon(10, 'maxSpeed')).toBe(TrendingUpIcon);
            expect(getTrendIcon(10, 'time')).toBe(TrendingUpIcon);
        });

        it('should return TrendingDownIcon for improvements in metrics where lower is better', () => {
            // For heart rate, negative trends (lower heart rate) should show up arrow
            expect(getTrendIcon(-10, 'heartRate')).toBe(TrendingUpIcon);

            // Special case: timePerKm should show down arrow for improvements (faster pace)
            expect(getTrendIcon(-10, 'timePerKm')).toBe(TrendingDownIcon);
        });

        it('should return appropriate icons for regressions', () => {
            // For standard metrics, negative trends are regressions
            expect(getTrendIcon(-10, 'distance')).toBe(TrendingDownIcon);

            // For heart rate, positive trends are regressions
            expect(getTrendIcon(10, 'heartRate')).toBe(TrendingDownIcon);

            // Special case: timePerKm should show up arrow for regressions (slower pace)
            expect(getTrendIcon(10, 'timePerKm')).toBe(TrendingUpIcon);
        });
    });
});
