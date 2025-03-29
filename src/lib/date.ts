import dayjs from 'dayjs';
import pl from 'dayjs/locale/pl';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

declare module 'dayjs' {
    interface Dayjs {
        format(format: string): string;
        tz(timezone: string): Dayjs;
    }
}

dayjs.locale(pl);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.tz.setDefault('Europe/Warsaw');

export default dayjs;
