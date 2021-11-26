import { CronScheduler } from './CronScheduler';
import { ScheduleFormatParser } from './ScheduleFormatParser';

test('scheduleOnce should have only 1 tick and scheduled on time', async (done) => {
    const cronSchedule = '*/2 * * * * *';
    const s = new CronScheduler();
    const start = new Date().getTime();
    s.scheduleOnce(cronSchedule, async () => {
        const end = new Date().getTime();
        expect(end - start).toBeLessThanOrEqual(2500);
        done();
    });
});

test('scheduleRepeating should run as defined for couple times', async (done) => {
    const cronSchedule = '*/1 * * * * *';
    const s = new CronScheduler();

    let counter = 0;
    let start = new Date().getTime();
    s.scheduleRepeating(cronSchedule, async () => {
        const end = new Date().getTime();
        expect(end - start).toBeLessThanOrEqual(1500);
        counter++;
        start = new Date().getTime();
        if (counter >= 2) done();
    });
});
