import { libx } from 'libx.js/build/bundles/essentials';
import Exception, { NotImplemented } from 'libx.js/build/helpers/Exceptions';
import { Mapping } from 'libx.js/build/types/interfaces';
import { NoSqlStructure } from './DB';
import { Database, ModuleOptions as DatabaseOptions } from './DB/Database';
import { IPersistencyManager } from './DB/PersistencyManagers/IPersistencyManager';
import { MemoryPersistencyManager } from './DB/PersistencyManagers/Memory';
import { IWorker } from './MessageQueue/IWorker';
import { MessageQueueManager } from './MessageQueue/MessageQueueManager';
import { Publisher } from './MessageQueue/Publisher';
import { CronScheduler, SchedulerTypes } from './Scheduler/CronScheduler';
import { IService } from './Servicer/IService';
import { Orchestrator } from './Servicer/Orchestrator';
import { RequestMethods, RequestX } from './Servicer/Request';
// import { ServiceProxy } from './Servicer/ServiceProxy';

export class Master {
    public services: Mapping<Orchestrator> = {};
    public db: Database;
    public mqMgr: MessageQueueManager;
    public mq: Mapping<Publisher> = {};
    private scheduler = new CronScheduler();

    constructor() {}

    public init() {}

    public async addService(endpoint: string, newFactory: () => Promise<IService> | IService, minCount = 1, maxCount = 1) {
        const newService = (this.services[endpoint] = new Orchestrator(newFactory, minCount, maxCount));
        await newService.initiate();
        return newService;
    }

    public async request(path: string, method: RequestMethods = RequestMethods.GET, body?: {}, options?: Partial<RequestX>) {
        let req: Partial<RequestX> = new RequestX(path, method, body);
        req = { ...req, ...options };
        return await this.requestWithReq(req as RequestX);
    }

    private async requestWithReq(request: RequestX) {
        const prefix = libx.getMatch(request.path, /(\/[^\/\?\#]*)\/?/)?.[0];
        const service = this.services[prefix];
        if (service == null) throw new Exception('Master:request: Could not locate service for given route', { request, prefix });
        request.path = request.path.substring(prefix.length);
        const ret = await service.handleIncomingRequest(request);
        return ret;
    }

    public async addDB(
        persistencyManager: IPersistencyManager = new MemoryPersistencyManager(),
        initialData?: NoSqlStructure,
        options?: Partial<DatabaseOptions>
    ) {
        if (this.db != null) throw new Exception('Master:addDB: DB already initiated');
        this.db = new Database({ persistencyManager, initialData, ...options });
        await this.db.onReady;
        libx.di.register('db', this.db);
        return this.db;
    }

    public async addMQ<T = any>(queueName: string, worker: IWorker<T>) {
        if (this.mqMgr == null) {
            this.mqMgr = new MessageQueueManager();
            libx.di.register('mq', this.mqMgr);
        }
        if (this.mq[queueName] != null) return this.mq[queueName];
        const publisher = await this.mqMgr.createQueue<T>(queueName);
        this.mqMgr.addWorker<T>(queueName, worker, 2);
        return (this.mq[queueName] = publisher);
    }

    public async addScheduler(recurrence: string, tick: () => void, schedulerType: SchedulerTypes) {
        if (schedulerType == SchedulerTypes.Once) return this.scheduler.scheduleOnce(recurrence, tick);
        else if (schedulerType == SchedulerTypes.Recurring) return this.scheduler.scheduleRepeating(recurrence, tick);
        else throw new Exception('Master:addScheduler: Unrecognized scheduler type', schedulerType, recurrence);
    }

    public async shutdown() {
        await this.db.shutdown();
        // TODO:
        // await this.scheduler.shutdown();
        // await this.services.forEach.shutdown();
        // await this.mqMgr.forEach.shutdown();
    }

    // TODO: Commented out to enable browserify of `Master`. Find a way to replace ServiceProxy with browser-compatible alternative

    // public async setupServiceProxy(port?: number) {
    //     const options = port != null ? { port } : null;
    //     const proxyServer = new ServiceProxy(this, options);
    //     await proxyServer.init();
    // }
}
