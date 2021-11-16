import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { delay } from 'libx.js/node_modules/concurrency.libx.js';
import { IRequest, RequestMethods } from './IRequest';
import { IService } from './IService';
import { Orchestrator } from './Orchestrator';

class Service implements IService {
    private isBusy = false;
    public id: String;
    public identifier: String;

    constructor() {
        this.id = libx.newGuid(true);
    }

    public bootstrap() {
        log.v('Service:bootstrap: ');
    }
    public async handle(request: IRequest) {
        this.isBusy = true;
        await delay(libx.randomNumber(1000 * 2) + 200);
        log.v('Service:handle: ', request);
        this.isBusy = false;
        return request.body + ':' + this.getIdentifier();
    }
    public teardown() {
        log.v('Service:teardown: ');
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

    public getIdentifier() {
        return this.identifier || (this.identifier = `${this.id.substring(0, 3)}`);
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
    console.log('stats: ', stats);
    expect(stats).toMatchObject({ instancesCount: 2, busyInstances: 0 });
});

test.only('should initiate 1 & handle incoming requests', async () => {
    const main = new Orchestrator(Service.new, 2, 3);
    await main.initiate();
    const stats = await main.getStats();
    const pAll: Promise<any>[] = [];

    pAll.push(main.handleIncomingRequest({ path: '/myService/test', method: RequestMethods.GET, body: 'A' }).then((res) => console.log('res: ', res)));
    pAll.push(main.handleIncomingRequest({ path: '/myService/test', method: RequestMethods.GET, body: 'B' }).then((res) => console.log('res: ', res)));
    pAll.push(main.handleIncomingRequest({ path: '/myService/test', method: RequestMethods.GET, body: 'C' }).then((res) => console.log('res: ', res)));
    pAll.push(main.handleIncomingRequest({ path: '/myService/test', method: RequestMethods.GET, body: 'D' }).then((res) => console.log('res: ', res)));

    await Promise.all(pAll);

    expect(stats).toMatchObject({ instancesCount: 2, busyInstances: 0 });
});
