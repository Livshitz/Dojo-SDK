import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { MyItem } from '.';
import { IWorker } from '../../MessageQueue/IWorker';
import { MessageEnvelop } from '../../MessageQueue/MessageEnvelop';
import { MessageQueueManager } from '../../MessageQueue/MessageQueueManager';

export class MyWorker implements IWorker<MyItem> {
    constructor() {}

    public async treat(item: MessageEnvelop<MyItem>, instanceIdentifier: String) {
        const x = libx.randomNumber(1000);
        await libx.sleep(x);
        log.v(`MQ: Treated (${instanceIdentifier})`, item, x);
    }
}
