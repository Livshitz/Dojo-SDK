import { Mapping } from 'libx.js/src/types/interfaces';
import { Consumer, Delegate } from './Consumer';
import { Publisher } from './Publisher';

export class MessageQueueManager {
    private publishers: Mapping<Publisher> = {};
    private consumers: Consumer[] = [];

    public async createQueue<T = any>(queueName: string) {
        const mq = new Publisher<T>(this, queueName);
        this.publishers[queueName] = mq;
        return mq;
    }

    public async addWorker<T = any>(queueName: string, delegate: Delegate<T>, instances = 1) {
        for (let i = 0; i < instances; i++) {
            const consumer = new Consumer<T>(this, delegate, i);
            this.consumers.push(consumer);
            const publisher: Publisher<T> = this.publishers[queueName];
            consumer.assign(publisher);
            await publisher.subscribe(async (message) => {
                if (message == null) return;
                await consumer.triggered(message);
            }, consumer.identifier);
        }
    }
}
