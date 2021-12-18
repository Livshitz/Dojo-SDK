import { log } from 'libx.js/build/modules/log';
import { node } from 'libx.js/build/node';
import { BaseRecipe, ModuleOptions as BaseRecipeOptions } from '../BaseRecipe';
import { DiskPersistencyManager } from '../DB/PersistencyManagers/Disk';
import { SchedulerTypes } from '../Scheduler/CronScheduler';
import { BaseService } from '../Servicer/BaseService';
import { IRequest, IResponse, ResponseTypes } from '../Servicer/Request';

// run: node build/examples/exampleRecipe.js
export class ExampleRecipe extends BaseRecipe {
    public problemStatement = `
    ========================================
    This is where you describe the challenge.
    ========================================
    `;

    public constructor(options?: Partial<BaseRecipeOptions>) {
        super(options);

        this.journal.broadcast('setup');
    }

    public async setup(): Promise<void> {
        this.journal.broadcast('setup: start');

        const initData = {
            col: {
                '618230709af3ade104bee1ff': {
                    a: 100,
                    _id: '618230709af3ade104bee1ff',
                },
            },
        };
        await this.master.addDB(new DiskPersistencyManager('./.tmp/db.json', true), initData, { continuosWrite: true });

        this.master.addScheduler(
            '*/5 * * * * *',
            async () => {
                log.i('tick');
            },
            SchedulerTypes.Recurring
        );

        this.master.addService(
            '/test',
            () =>
                new (class extends BaseService {
                    async handle(req: IRequest, res: IResponse) {
                        log.i('Service:', req);
                        res.body = { a: `hello!? from ${this.identifier}`, ...req };
                        res.type = ResponseTypes.OK;
                        return res;
                        // super.handle(req);
                    }
                })(),
            1,
            10
        );

        this.master.setupServiceProxy(); // call through: http://localhost:3000/test?q=1

        this.journal.broadcast('setup: end');
    }

    public async run() {
        console.log('run222!');
    }
}

if (node.isCalledDirectly()) {
    node.catchErrors();
    (async () => {
        const recipe = new ExampleRecipe();
        await recipe.setup();
        recipe.run();

        await node.prompts.waitForAnyKey('Press any key to finish this recipe...', false);

        recipe.printJournal();
        process.exit(0); // force exit, required if run with `waitForAnyKey`
    })();
}