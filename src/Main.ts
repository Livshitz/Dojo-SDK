import { log } from 'libx.js/build/modules/log';
import { libx } from 'libx.js/build/bundles/node.essentials';
import { MessageQueueManager } from './MessageQueue/MessageQueueManager';
import { Publisher } from './MessageQueue/Publisher';
import { Consumer } from './MessageQueue/Consumer';
import { CronScheduler } from './Scheduler/CronScheduler';
import { ScheduleFormatParser } from './Scheduler/ScheduleFormatParser';

export default class App {
    constructor() {}

    public async run() {
        // log.isDebug = true;

        const cronSchedule = '*/5    *    *    *    *    *'; //'42 * * * *';
        // const res = ScheduleFormatParser.parseCronFormat(cronSchedule);
        const s = new CronScheduler();
        s.scheduleOnce(cronSchedule, async () => {
            console.log('Single tick!');
        });
        const p = s.scheduleRepeating(cronSchedule, async () => {
            console.log('!!! Recurring tick!!!');
        });

        // Grace period:
        await libx.node.prompts.waitForAnyKey();
        log.i('Key pressed');
    }
}

class MyItem {
    public str: string;
    public num: number;
}

class Program {
    public static async main() {
        let error: Error = null;

        try {
            console.log('----------------');
            let app = new App();
            await app.run();
            console.log('DONE');
        } catch (err) {
            error = err;
        } finally {
            let errorCode = 0;
            if (error) {
                console.error('----- \n [!] Failed: ', error);
                errorCode = 1;
            }

            if (require.main === module) process.exit(errorCode);
        }
    }
}

Program.main(); // Comment if you don't want to use this file as node script and self execute
