import { browserHelpers } from 'libx.js/build/browser/browserHelpers';
import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { IService } from '../../Servicer/IService';
import { IRequest } from '../../Servicer/Request';

export class Service implements IService {
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
    public async handle(request: IRequest) {
        this.isBusy = true;
        const delayTime = browserHelpers.queryString('delay', request.path) || libx.randomNumber(1000 * 2) + 200;
        await libx.delay(delayTime);
        log.d(
            'Service:handle: ',
            delayTime,
            request.body,
            request.reqId.substr(-4),
            this.identifier,
            `${request.getAgeMS()}ms`,
            `counter; ${this.jobsTreated + 1}`
        );
        this.isBusy = false;
        request.response = request.body + ':' + this.identifier;
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
