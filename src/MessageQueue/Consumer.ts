import { log, LogLevel } from 'libx.js/build/modules/log';
import { MessageQueueManager } from './MessageQueueManager';
import { MessageEnvelop } from './MessageEnvelop';
import { Publisher } from './Publisher';
import { libx } from 'libx.js/build/bundles/node.essentials';

export type Delegate<T = any> = (item: MessageEnvelop<T>, instanceIdentifier: String) => Promise<void>;

export class Consumer<T = any> {
    private publisher: Publisher;
    public identifier: String;
    public isBusy = false;
    public id: string;
    public queueName: string;
    constructor(private manager: MessageQueueManager, private treat: Delegate<T>, public instanceNum: number) {
        this.id = libx.newGuid(true);
    }

    public assign(publisher: Publisher) {
        this.publisher = publisher;
        this.queueName = publisher.name;
    }

    public async triggered(message: MessageEnvelop<T>) {
        await libx.sleep(0); // Will allow event-loop to properly propagate concurrent changes
        if (this.isBusy) return;
        log.d(this.getIdentifier() + ': Treating message', this.id, message);

        if (await this.publisher.lock(message)) {
            if (this.isBusy == false) {
                log.d(this.getIdentifier() + ': locking', this.id, this.isBusy);
                this.isBusy = true;

                try {
                    await this.treat(message, this.getIdentifier());
                    await this.publisher.ack(message);
                } catch (ex) {
                    log.e(this.getIdentifier() + ': Error while treating message', ex, message);
                    await this.publisher.nack(message);
                }
                log.d(this.getIdentifier() + ': releasing', this.id);
            } else {
                log.d(this.getIdentifier() + ': consumer already busy', this.id);
                await this.publisher.nack(message);
            }
        } else {
            log.d(this.getIdentifier() + ': message already locked', this.id, message);
        }

        this.isBusy = false;
    }

    private getIdentifier() {
        return this.identifier || (this.identifier = `Consumer: ${this.queueName}:${this.instanceNum}:${this.id.substring(0, 3)}`);
    }
}
