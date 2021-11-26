import { libx } from 'libx.js/build/bundles/node.essentials';
import { IScript } from 'libx.js/build/helpers/IScript';
import Program from 'libx.js/build/node/Program';
import { log } from 'libx.js/build/modules/log';
import { Master } from '../Master';
import { Service } from './Services/Service';
import { IRequest, Request, RequestMethods } from '../Servicer/Request';
import { DiskPersistencyManager } from '../DB/PersistencyManagers/Disk';
import { MyWorker } from './MQ/MyWorker';
import { delay } from 'libx.js/node_modules/concurrency.libx.js';
import { SchedulerTypes } from '../Scheduler/CronScheduler';
import { BaseService } from '../Servicer/BaseService';
import faker from '../Faker';

log.isDebug = true;

const conf = {
    envs: {},
};

// $ node build/examples/master.js
class Script implements IScript<typeof conf> {
    public async executeAsScript(config: typeof conf): Promise<void> {
        const master = new Master();
        await master.addDB(new DiskPersistencyManager('./.tmp/db.json'), {
            col: {
                '618230709af3ade104bee1ff': {
                    a: 100,
                    _id: '618230709af3ade104bee1ff',
                },
                '6182309dcf217e4f830e9de1': {
                    a: 5,
                    _id: '6182309dcf217e4f830e9de1',
                },
            },
        });
        await master.addMQ('queue1', new MyWorker());
        // await master.addMQ('queue1', { treat: (item) => console.log('----', item) });
        await master.addService('/my-resource', Service.new, 1, 10);
        // await master.addService(
        //     '/my-resource',
        //     () =>
        //         new (class extends BaseService {
        //             async handle(req: IRequest) {
        //                 console.log('Service:', req);
        //             }
        //         })(),
        //     1,
        //     10
        // );
        master.addScheduler(
            '*/5 * * * * *',
            () => {
                log.i('Scheduler: TICK!', faker.random.words(10));
            },
            SchedulerTypes.Recurring
        );

        await master.request(new Request('/my-resource/getSomething', RequestMethods.GET));
        // await master.request(new Request('/my/testx', RequestMethods.GET));

        const input = await libx.node.prompts.readKey(async (k) => {
            if (k == 'i') {
                log.i('Inserting bulk messages');
                for (let i = 0; i < 100; i++) {
                    master.request(new Request('/my-resource/test?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'Bulk'));
                }
            } else if (k == 'a') {
                log.i('Inserting message A');
                master.request(new Request('/my-resource/testA?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'A'));
            } else if (k == 'b') {
                log.i('Inserting message B');
                master.request(new Request('/my-resource/testB?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'B'));
            } else if (k == 'q') {
                log.i('quitting...');
                return false;
            }
        }, 'Press\n "i" to insert bulk messages,\n "a" to insert message A,\n "b" to insert message B,\n "q" to quit...');
        log.i('Keys pressed', input);
    }
}

if (libx.node.isCalledDirectly()) Program.run(new Script(), conf, Program.args.env || 'prod');
