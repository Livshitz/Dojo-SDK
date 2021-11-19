import { IService } from './IService';
import { IRequest } from './Request';
import { Queue } from 'libx.js/build/modules/Queue';
import { Callbacks } from 'libx.js/build/modules/Callbacks';
import { log, LogLevel } from 'libx.js/build/modules/log';
import { libx } from 'libx.js/build/bundles/essentials';

// log.isDebug = true;
export class Orchestrator {
    private instances: IService[] = [];
    private queue: Queue<IRequest> = new Queue<IRequest>([], { onEnqueueCallback: this.treat.bind(this) });
    private isBusy = false;
    private serviceTTL_MS = 200;
    public onIdle = new Callbacks();
    public onBusy = new Callbacks();
    public onJobCompleted = new Callbacks<IRequest>();
    public onAutoScale = new Callbacks<number>();

    constructor(private serviceFactory: () => Promise<IService>, private minCount = 1, private maxCount = 3) {
        this.onJobCompleted.subscribe(this.onJobCompletedCallback.bind(this));
    }

    public async initiate() {
        await this.scaleUp(this.minCount);
    }

    public async getStats() {
        return {
            instancesCount: this.instances.length,
            busyInstances: (await Promise.all(this.instances.map(async (x) => await x.getIsBusy()))).filter((x) => x == true).length,
            pendingJobs: this.queue.count(),
        };
    }

    public async handleIncomingRequest(request: IRequest): Promise<IRequest> {
        log.d('Orchestrator:handleIncomingRequest: New incoming request', request);
        if (request.promise == null) request.promise = libx.newPromise();
        this.queue.enqueue(request);
        return request.promise;
    }

    private async getFreeInstance() {
        const busyMap = await Promise.all(this.instances.map(async (x) => ({ busy: await x.getIsBusy(), instance: x })));
        for (let instance of busyMap) {
            if (instance.busy) continue;
            return instance.instance;
        }
    }

    private async treat() {
        const stats = await this.getStats();
        log.d('Orchestrator:treat: stats:', stats);
        const instance = await this.getFreeInstance();
        if (instance == null) {
            const shouldScale = this.instances.length < this.maxCount;
            log.d(
                'Orchestrator:treat: No available instances, ' +
                    (shouldScale
                        ? `will try to scale from ${this.instances.length} by one instance (${this.maxCount} max)`
                        : 'will wait until completion of running jobs...')
            );

            this.scaleUp(1);
            return;
        }
        const request = this.queue.dequeue();
        if (request == null) {
            log.d('Orchestrator:treat: No more pending jobs...');
            if (this.isBusy && stats.busyInstances == 0) {
                this.onIdle.trigger(stats);
                this.isBusy = false;
            }
            setTimeout(async () => {
                if (this.queue.count() == 0) {
                    this.tryScaleDown();
                }
            }, 100);

            return;
        }
        let p: Promise<any>;
        log.d('Orchestrator:treat: Treating...');
        p = instance.handle(request);
        if (this.isBusy == false) {
            this.isBusy = true;
            this.getStats().then((stats) => {
                if (stats.busyInstances > 0) this.onBusy.trigger(stats);
            });
        }
        p.then(() => {
            this.onJobCompleted.trigger(request);
            request.promise.resolve(request);
        });
        return p;
    }

    private async onJobCompletedCallback(request: IRequest) {
        log.d('Orchestrator:onJobCompletedCallback', request.reqId.substr(-4));
        this.treat();
    }

    private async scaleUp(count = 1) {
        log.d(`Orchestrator:scaleUp: Scale up by:${count}, Count:${this.instances.length}`);
        let isScaled = false;
        if (this.instances.length >= this.maxCount) return;
        for (let i = 0; i < count; i++) {
            const newService = await this.serviceFactory();
            this.instances.push(newService);
            isScaled = true;
        }
        if (isScaled) {
            this.onAutoScale.trigger(this.instances.length);
            setTimeout(() => this.treat(), 100);
        }
    }

    private async tryScaleDown(count = 1) {
        if (this.instances.length <= this.minCount) return;
        log.d(`Orchestrator:tryScaleDown: Scale down by:${count}, Count:${this.instances.length}`);
        let ret = false;
        let isScaled = false;
        for (let instance of this.instances) {
            if (await instance.getIsBusy()) continue;
            // if (new Date().getTime() - instance.createdAt.getTime() < this.serviceTTL_MS) continue;

            const removed = this.instances.shift();
            count--;
            removed.teardown();
            isScaled = true;
            if (count <= 0) break;
        }
        if (isScaled) {
            this.onAutoScale.trigger(this.instances.length);
        }
        return ret;
    }
}
