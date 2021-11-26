import { libx } from 'libx.js/build/bundles/essentials';
import Exception from 'libx.js/build/helpers/Exceptions';
import { Mapping } from 'libx.js/build/types/interfaces';
import { NoSqlStructure } from './DB';
import { Database } from './DB/Database';
import { IPersistencyManager } from './DB/PersistencyManagers/IPersistencyManager';
import { MemoryPersistencyManager } from './DB/PersistencyManagers/Memory';
import { IWorker } from './MessageQueue/IWorker';
import { MessageQueueManager } from './MessageQueue/MessageQueueManager';
import { Publisher } from './MessageQueue/Publisher';
import { CronScheduler, SchedulerTypes } from './Scheduler/CronScheduler';
import { IService } from './Servicer/IService';
import { Orchestrator } from './Servicer/Orchestrator';
import { RequestMethods, Request } from './Servicer/Request';

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

    public async request(request: Request) {
        const prefix = libx.getMatch(request.path, /(\/[^\/]*)\/?/)?.[0];
        const service = this.services[prefix];
        if (service == null) throw new Exception('Master:request: Could not locate service for given route', { request, prefix });
        request.path = request.path.substr(prefix.length);
        return await service.handleIncomingRequest(request);
    }

    public async addDB(persistencyManager: IPersistencyManager = new MemoryPersistencyManager(), initialData?: NoSqlStructure) {
        if (this.db != null) throw new Exception('Master:addDB: DB already initiated');
        this.db = new Database({ persistencyManager, initialData });
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
}