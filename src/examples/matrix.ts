import { libx } from 'libx.js/build/bundles/node.essentials';
import { IScript } from 'libx.js/build/helpers/IScript';
import Program from 'libx.js/build/node/Program';
import { log } from 'libx.js/build/modules/log';
import { Matrix } from '../Matrix';
import { Service } from './Services/Service';
import { IRequest, RequestX, RequestMethods, IResponse, ResponseTypes } from '../Servicer/Request';
import { DiskPersistencyManager } from '../DB/PersistencyManagers/Disk';
import { MyWorker } from './MQ/MyWorker';
import { SchedulerTypes } from '../Scheduler/CronScheduler';
import { BaseService } from '../Servicer/BaseService';
import faker from 'faker';

log.isDebug = true;

const conf = {
    envs: {},
};

// Run:
// $ node build/examples/master.js
class Script implements IScript<typeof conf> {
    public async executeAsScript(config: typeof conf): Promise<void> {
        const master = new Matrix();
        await master.addDB(new DiskPersistencyManager('./.tmp/db.json', true), {
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
        await master.addService(
            '/my-inline',
            () =>
                new (class extends BaseService {
                    async handle(req: IRequest, res: IResponse) {
                        console.log('Service:', req);
                        res.type = ResponseTypes.OK;
                        res.body = `You got it!`;
                        return res;
                    }
                })(),
            1,
            10
        );
        master.addScheduler(
            '*/5 * * * * *',
            () => {
                log.i('Scheduler: TICK!', faker.random.words(10));
            },
            SchedulerTypes.Recurring
        );

        await master.request('/my-resource/getSomething');

        const input = await libx.node.prompts.readKey(async (k) => {
            if (k == 'i') {
                log.i('Inserting bulk messages');
                for (let i = 0; i < 100; i++) {
                    master.request('/my-resource/test?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'Bulk');
                }
            } else if (k == 'a') {
                log.i('Inserting message A');
                master.request('/my-resource/testA?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'A');
            } else if (k == 'b') {
                log.i('Inserting message B');
                master.request('/my-resource/testB?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'B');
            } else if (k == 'q') {
                log.i('quitting...');
                return false;
            }
        }, 'Press\n "i" to insert bulk messages,\n "a" to insert message A,\n "b" to insert message B,\n "q" to quit...');
        log.i('Keys pressed', input);
    }
}

if (libx.node.isCalledDirectly()) Program.run(new Script(), conf, Program.args.env || 'prod');
