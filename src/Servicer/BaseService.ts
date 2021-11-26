import { browserHelpers } from 'libx.js/build/browser/browserHelpers';
import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { Mapping } from 'libx.js/src/types/interfaces';
import { helpers } from 'libx.js/build/helpers/index';
import Exception from 'libx.js/build/helpers/Exceptions';
import { IService } from './IService';
import { IRequest } from './Request';
import { Database } from '../DB/Database';
import { MessageQueueManager } from '../MessageQueue/MessageQueueManager';

export class BaseService implements IService {
    public id: String;
    public identifier: String;
    public createdAt: Date;
    public jobsTreated = 0;
    protected isBusy = false;
    protected handlers: Mapping<Handler> = {
        '/': this.handler_default.bind(this),
    };

    constructor() {
        this.id = libx.newGuid(true);
        this.identifier = this.identifier || (this.identifier = `${this.id.substring(0, 3)}`);
        this.createdAt = new Date();

        this.bootstrap();
    }

    public bootstrap() {
        log.d('BaseService:bootstrap: ');
    }

    public async handle(request: IRequest) {
        this.isBusy = true;

        const url = helpers.parseUrl(request.path);
        const handler = this.handlers['/' + url.path];
        if (handler != null) handler(request);
        else this.handler_default(request);

        log.d(
            'BaseService:handle: ',
            request.body,
            request.reqId.substr(-4),
            this.identifier,
            `${request.getAgeMS()}ms`,
            `counter; ${this.jobsTreated + 1}`,
            `path: ${request.path}`
        );
        this.isBusy = false;
        request.response = request.body + ':' + this.identifier;
        this.jobsTreated++;
    }
    public teardown() {
        log.d('BaseService:teardown: ');
    }
    public async getIsBusy() {
        return this.isBusy;
    }

    public static async new(): Promise<IService> {
        return await libx.di.initiate(BaseService);
    }

    protected async handler_default(request: IRequest) {
        const delayTime = browserHelpers.queryString('delay', request.path) || libx.randomNumber(1000 * 2) + 200;
        await libx.delay(delayTime);
    }
}

type Handler = (request: IRequest) => Promise<IRequest | void>;