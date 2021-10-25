import { log } from 'libx.js/build/modules/log';
import { Deferred, delay } from 'libx.js/node_modules/concurrency.libx.js';
import { ScheduleFormatParser } from './ScheduleFormatParser';

export class CronScheduler<T = any> {
    constructor() {}

    public async scheduleOnce(cronSchedulingFormat: string, tick?: () => Promise<void>) {
        const next = ScheduleFormatParser.parseCronFormat(cronSchedulingFormat);
        log.d('CronScheduler:scheduleOnce: Calculating next tick and waiting...', cronSchedulingFormat, next);
        await delay(next.getTime() - new Date().getTime());
        log.d('CronScheduler:scheduleOnce: Passed, ticking...');
        if (tick != null) await tick();
    }

    public async scheduleRepeating(cronSchedulingFormat: string, tick: () => Promise<void>) {
        log.d('CronScheduler:scheduleRepeating: setting up...', cronSchedulingFormat);
        const p = new Deferred();
        this.scheduleOnce(cronSchedulingFormat, async () => {
            log.d('CronScheduler:scheduleRepeating: tick reached, scheduling next tick...', cronSchedulingFormat);
            await tick();
            await this.scheduleRepeating(cronSchedulingFormat, tick);
        });
        return p;
    }
}

/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
*/
