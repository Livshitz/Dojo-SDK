import parser from 'cron-parser';
export class ScheduleFormatParser {
    public static parseCronFormat(input: string, timezone?: string): Date {
        return parser.parseExpression(input, { tz: timezone }).next().toDate();
    }
}
