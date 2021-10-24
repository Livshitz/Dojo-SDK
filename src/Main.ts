import { log } from 'libx.js/build/modules/log';
import { libx } from 'libx.js/build/bundles/node.essentials';
import { MessageQueueManager } from './MessageQueue/MessageQueueManager';
import { Publisher } from './MessageQueue/Publisher';
import { Consumer } from './MessageQueue/Consumer';

export default class App {
    constructor() {}

    public async run() {
        // log.isDebug = true;

        // Setup:
        const mqMgr = new MessageQueueManager();
        const queue1 = await mqMgr.createQueue('queue1');
        const queue2 = await mqMgr.createQueue('queue2');

        mqMgr.addWorker<MyItem>(
            'queue1',
            async (item, instanceIdentifier) => {
                log.v(`${instanceIdentifier}: treating item`, item.payload);
                await libx.sleep(1000);
                log.v(`${instanceIdentifier}: done`, item.payload);
            },
            2
        );
        mqMgr.addWorker<MyItem>('queue2', async (item, instanceIdentifier) => {
            log.v(`${instanceIdentifier}:xx: treating item`, item.payload);
            await libx.sleep(100);
            log.v(`${instanceIdentifier}:xx: done`, item.payload);
        });

        // Simulate new message:
        queue1.enqueue({ num: 11, str: 's11' });
        queue1.enqueue({ num: 12, str: 's12' });
        queue1.enqueue({ num: 13, str: 's13' });

        queue2.enqueue({ num: 21, str: 's21' });
        queue2.enqueue({ num: 22, str: 's22' });
        await libx.sleep(100);
        queue1.enqueue({ num: 14, str: 's14' });

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
