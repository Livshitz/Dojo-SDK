import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { browserHelpers } from 'libx.js/build/browser/browserHelpers';
import { helpers } from 'libx.js/build/helpers';
import { IRequest, RequestX, RequestMethods, IResponse } from './Request';
import { IService } from './IService';
import { Orchestrator } from './Orchestrator';

class Service implements IService {
    private isBusy = false;
    public id: String;
    public identifier: String;
    public createdAt: Date;
    public jobsTreated = 0;

    constructor() {
        this.id = libx.newGuid(true);
        this.identifier = this.identifier || (this.identifier = `${this.id.substring(0, 3)}`);
        this.createdAt = new Date();

        this.bootstrap();
    }

    public bootstrap() {
        log.d('Service:bootstrap: ');
    }
    public async handle(request: IRequest, res: IResponse) {
        this.isBusy = true;
        const delayTime = browserHelpers.queryString('delay', request.path) || libx.randomNumber(1000 * 2) + 200;
        await helpers.delay(delayTime);
        log.d(
            'Service:handle: ',
            delayTime,
            request.body,
            request.reqId.substring(-4),
            this.identifier,
            `${request.getAgeMS()}ms`,
            `counter; ${this.jobsTreated + 1}`
        );
        this.isBusy = false;
        res.body = request.body; // + ':' + this.identifier;
        this.jobsTreated++;
    }
    public teardown() {
        log.d('Service:teardown: ');
    }
    public async getIsBusy() {
        return this.isBusy;
    }
    public async getThroughput() {
        return 0;
    }

    public static async new(): Promise<IService> {
        return new Service();
    }
}

test('should initiate 1', async () => {
    const main = new Orchestrator(Service.new, 1, 3);
    await main.initiate();
    const stats = await main.getStats();
    expect(stats).toMatchObject({ instancesCount: 1, busyInstances: 0 });
});

test('should initiate 2', async () => {
    const main = new Orchestrator(Service.new, 2, 3);
    await main.initiate();
    const stats = await main.getStats();
    log.d('stats: ', stats);
    expect(stats).toMatchObject({ instancesCount: 2, busyInstances: 0 });
});

test('should initiate 1 with autoscale to 3 & handle incoming requests', async () => {
    const main = new Orchestrator(Service.new, 1, 3);
    await main.initiate();
    const pAll: Promise<any>[] = [];

    main.onBusy.subscribe((stats) => {
        log.d('onBusy', stats);
        expect(stats).toMatchObject({ instancesCount: 1 });
        expect(stats.busyInstances).toBeGreaterThanOrEqual(1);
    });
    main.onIdle.subscribe((stats) => {
        log.d('onIdle', stats);
        expect(stats).toMatchObject({ instancesCount: 3, busyInstances: 0 });
    });

    const completed = [];
    pAll.push(main.handleIncomingRequest(new RequestX('/myService/test?delay=30', RequestMethods.GET, 'A')).then((x) => completed.push(x.body)));
    pAll.push(main.handleIncomingRequest(new RequestX('/myService/test?delay=2', RequestMethods.GET, 'B')).then((x) => completed.push(x.body)));
    pAll.push(main.handleIncomingRequest(new RequestX('/myService/test?delay=80', RequestMethods.GET, 'C')).then((x) => completed.push(x.body)));
    pAll.push(main.handleIncomingRequest(new RequestX('/myService/test?delay=40', RequestMethods.GET, 'D')).then((x) => completed.push(x.body)));

    await Promise.all(pAll);

    expect(completed).toMatchObject(['B', 'A', 'D', 'C']);
    const stats = await main.getStats();
    expect(stats).toMatchObject({ instancesCount: 3, busyInstances: 0 });
});

test('should auto scale on load', async (done) => {
    const main = new Orchestrator(Service.new, 1, 10);
    await main.initiate();
    const pAll: Promise<any>[] = [];
    let start: Date;
    let duration: number;

    main.onBusy.subscribe((stats) => {
        log.d('onBusy', stats);
        start = new Date();
        expect(stats).toMatchObject({ instancesCount: 1 });
        expect(stats.busyInstances).toBeGreaterThanOrEqual(1);
    });
    main.onIdle.subscribe((stats) => {
        duration = new Date().getTime() - start.getTime();
        log.d(`onIdle: Duration: ${duration}ms`, stats);
        expect(stats).toMatchObject({ busyInstances: 0 });
        expect(duration).toBeLessThanOrEqual(150);
    });
    main.onAutoScale.subscribe(async (instances) => {
        // console.log('onAutoScale: instances:', instances);
        const stats = await main.getStats();
        // expect(stats).toMatchObject({ instancesCount: 1, busyInstances: 0 });
        if (instances == 1 && stats.pendingJobs == 0) {
            duration = new Date().getTime() - start.getTime();
            log.d(`onAutoScale: Scaled down to min, Duration: ${duration}ms`, stats);
            expect(duration).toBeLessThanOrEqual(300);
            done();
        }
    });

    const completed = [];
    for (let i = 0; i < 10; i++) {
        pAll.push(
            main
                .handleIncomingRequest(new RequestX('/myService/test?delay=' + libx.randomNumber(10), RequestMethods.GET, 'A'))
                .then((x) => completed.push(x.body))
        );
    }

    await Promise.all(pAll);

    expect(completed.length).toEqual(10);
});
