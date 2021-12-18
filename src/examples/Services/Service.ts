import { browserHelpers } from 'libx.js/build/browser/browserHelpers';
import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { Mapping } from 'libx.js/build/types/interfaces';
import { helpers } from 'libx.js/build/helpers/index';
import { IService } from '../../Servicer/IService';
import { IRequest, IResponse } from '../../Servicer/Request';
import { Database } from '../../DB/Database';
import Exception from 'libx.js/build/helpers/Exceptions';
import { MessageQueueManager } from '../../MessageQueue/MessageQueueManager';
import { BaseService } from '../../Servicer/BaseService';

export class Service extends BaseService {
    constructor(protected db: Database, protected mq: MessageQueueManager) {
        super();

        this.handlers = {
            '/testA': this.handler_testA.bind(this),
            '/testB': this.handler_testB.bind(this),
            '/': this.handler_default.bind(this),
        };
    }

    public async handle(request: IRequest, res: IResponse) {
        this.isBusy = true;

        const url = helpers.parseUrl(request.path);
        const handler = this.handlers['/' + url.path];
        if (handler != null) handler(request);
        else this.handler_default(request);

        log.d(
            'Service:handle: ',
            request.body,
            request.reqId.substring(-4),
            this.identifier,
            `${request.getAgeMS()}ms`,
            `counter; ${this.jobsTreated + 1}`,
            `path: ${request.path}`
        );
        this.isBusy = false;
        res.body = request.body + ':' + this.identifier;
        this.jobsTreated++;
    }

    public bootstrap() {
        log.d('Service:bootstrap: ');
    }

    public static async new(): Promise<IService> {
        return await libx.di.initiate(Service);
    }

    protected async handler_default(request: IRequest) {
        const delayTime = browserHelpers.queryString('delay', request.path) || libx.randomNumber(1000 * 2) + 200;
        await libx.delay(delayTime);
    }

    protected async handler_testA(request: IRequest) {
        const obj = await this.db.get('col', '618230709af3ade104bee1ff');
        console.log('handler_testA', request, obj);
        await this.db.insert('col', { a: 1 });
    }

    protected async handler_testB(request: IRequest) {
        const x = await this.db.findOne('col', (x) => x.a == 1);
        (await this.mq.getPublisher('queue1')).enqueue('This is a new message in queue!');
        console.log('handler_testB', request, x);
    }
}

type Handler = (request: IRequest) => Promise<IRequest | void>;
