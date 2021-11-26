import { log, LogLevel } from 'libx.js/build/modules/log';
import { MessageQueueManager } from './MessageQueueManager';
import { MessageEnvelop } from './MessageEnvelop';
import { Publisher } from './Publisher';
import { libx } from 'libx.js/build/bundles/node.essentials';

export type Delegate<T = any> = (item: MessageEnvelop<T>, instanceIdentifier: String) => Promise<void> | void;

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

        // log.d(`Consumer: ${this.getIdentifier()}: Attempting to lock`, message, this.isBusy);
        if (await this.publisher.lock(message)) {
            if (this.isBusy == false) {
                log.d(`Consumer: ${this.getIdentifier()}: Successfully locked, treating message`, message);
                this.isBusy = true;

                try {
                    await this.treat(message, this.getIdentifier());
                    log.d(`Consumer: ${this.getIdentifier()}: Treatment completed successfully, releasing`, message);
                    await this.publisher.ack(message);
                } catch (ex) {
                    log.e(`Consumer: ${this.getIdentifier()}: Error while treating, rejecting message`, ex, message);
                    await this.publisher.reject(message);
                }
            } else {
                log.d(`Consumer: ${this.getIdentifier()}: Consumer already busy`);
                await this.publisher.reject(message);
            }
        } else {
            log.d(`Consumer: ${this.getIdentifier()}: Message already locked`, message);
        }

        this.isBusy = false;
    }

    private getIdentifier() {
        return this.identifier || (this.identifier = `${this.queueName}:${this.instanceNum}:${this.id.substring(0, 3)}`);
    }
}
