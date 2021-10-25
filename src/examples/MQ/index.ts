import { libx } from 'libx.js/build/bundles/node.essentials';
import { IScript } from 'libx.js/build//helpers/IScript';
import { log } from 'libx.js/build/modules/log';
import Program from 'libx.js/build/node/Program';
import { MessageQueueManager } from '../../MessageQueue/MessageQueueManager';
import { MyWorker } from './MyWorker';

const conf = {
    envs: {},
};

export class MyItem {
    public str: string;
    public num: number;
}

// $ node build/examples/MQ/index.js
class Script implements IScript<typeof conf> {
    public async executeAsScript(config: typeof conf, env: string = Program.args.env, envConf): Promise<void> {
        // log.verbose('Script: Execute: ', 'config:', config, 'env:', env, 'envConf: ', envConf.baseUrl);

        const mqMgr = new MessageQueueManager();
        await mqMgr.createQueue<MyItem>('queue1');
        const myWorker = new MyWorker(mqMgr);

        const queue1 = await mqMgr.getPublisher('queue1');

        // Grace period:
        // await libx.node.prompts.waitForAnyKey();
        const input = await libx.node.prompts.readKey(async (k) => {
            console.log(libx.toUnicode(k));

            if (k == 'i') {
                log.i('Inserting bulk messages');
                for (let i = 0; i < 10; i++) {
                    queue1.enqueue({ num: i, str: 's' + i });
                }
            } else if (k == 'a') {
                log.i('Inserting message A');
                queue1.enqueue({ num: 100, str: 'message A' });
            } else if (k == 'b') {
                log.i('Inserting message B');
                queue1.enqueue({ num: 200, str: 'message B' });
            }
        }, 'Press "i" to insert bulk messages, "a" to insert message A, and "b" to insert message B...');
        log.i('Keys pressed', input);

        return;
    }
}

if (libx.node.isCalledDirectly()) Program.run(new Script(), conf, Program.args.env || 'prod');
