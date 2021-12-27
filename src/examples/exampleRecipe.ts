import { log } from 'libx.js/build/modules/log';
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

        this.journal.emit('setup');
    }

    public async setup(): Promise<void> {
        this.journal.emit('setup: start');

        const initData = {
            col: {
                '618230709af3ade104bee1ff': {
                    a: 100,
                    _id: '618230709af3ade104bee1ff',
                },
            },
        };
        await this.matrix.addDB(new DiskPersistencyManager('./.tmp/db.json', true), initData, { continuosWrite: true });

        this.matrix.addScheduler(
            '*/5 * * * * *',
            async () => {
                log.i('tick');
            },
            SchedulerTypes.Recurring
        );

        this.matrix.addService(
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

        // this.matrix.setupServiceProxy(); // call through: http://localhost:3000/test?q=1

        this.journal.emit('setup: end');
    }

    public async run() {
        console.log('run222!');
    }
}

/*
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
*/
