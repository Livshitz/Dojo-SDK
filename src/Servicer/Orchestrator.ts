import { IService } from './IService';
import { IRequest } from './IRequest';

export class Orchestrator {
    private instances: IService[] = [];
    constructor(private serviceFactory: () => Promise<IService>, private minCount = 1, private maxCount = 3) {}

    public async initiate() {
        for (let i = 0; i < this.minCount; i++) {
            const newService = await this.serviceFactory();
            this.instances.push(newService);
        }
    }

    public async getStats() {
        return {
            instancesCount: this.instances.length,
            busyInstances: (await Promise.all(this.instances.map(async (x) => await x.getIsBusy()))).filter((x) => x == true).length,
        };
    }

    public async handleIncomingRequest(request: IRequest) {
        const instance = await this.getFreeInstance();
        return await instance.handle(request);
    }

    private async getFreeInstance() {
        const busyMap = await Promise.all(this.instances.map(async (x) => ({ busy: await x.getIsBusy(), instance: x })));
        for (let instance of busyMap) {
            if (instance.busy) continue;
            return instance.instance;
        }
    }
}
