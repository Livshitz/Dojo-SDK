import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { MyItem } from '.';
import { MessageEnvelop } from '../../MessageQueue/MessageEnvelop';
import { MessageQueueManager } from '../../MessageQueue/MessageQueueManager';

export class MyWorker {
    constructor(mgr: MessageQueueManager) {
        mgr.addWorker<MyItem>('queue1', this.treat);
    }

    private async treat(item: MessageEnvelop<MyItem>, instanceIdentifier: String) {
        await libx.sleep(libx.randomNumber(100));
        log.v(`Treated (${instanceIdentifier})`, item);
    }
}
