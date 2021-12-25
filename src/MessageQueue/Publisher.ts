import { Action, EventsStream } from 'libx.js/build/modules/EventsStream';
import { Mapping } from 'libx.js/build/types/interfaces';
import Exception from 'libx.js/build/helpers/Exceptions';
import { log } from 'libx.js/build/modules/log';
import { ArrayExtensions } from 'libx.js/build/extensions/ArrayExtensions';
import { MessageQueueManager } from './MessageQueueManager';
import { MessageEnvelop, MessageEnvelopStatuses } from './MessageEnvelop';
import { Delegate } from './Consumer';

export class Publisher<T = any> {
    private queue: MessageEnvelop<T>[] = [];
    private map: Mapping<MessageEnvelop<T>> = {};
    private onNew: EventsStream<MessageEnvelop<T>>;
    private onAck: EventsStream<MessageEnvelop<T>>;
    constructor(private manager: MessageQueueManager, public name: string) {
        this.onNew = new EventsStream<MessageEnvelop<T>>();
        this.onAck = new EventsStream<MessageEnvelop<T>>();

        this.onAck.subscribe((message) => {
            if (message == null) return;
            ArrayExtensions.remove.call(this.queue, message.payload);
            delete this.map[message.payload.id];
        });
    }

    public async subscribe(action: Delegate<T>, consumerIdentifier: String) {
        this.onNew.subscribe(async (event) => {
            if (event == null) return;
            await action(event.payload, consumerIdentifier);
        });
    }

    public async enqueue(item: T) {
        const newMessage = new MessageEnvelop(item);
        this.queue.push(newMessage);
        this.map[newMessage.id] = newMessage;
        newMessage.status = MessageEnvelopStatuses.ready;

        await this.tryBroadcastNext();
    }

    public async tryBroadcastNext() {
        if (this.queue.length == 0) return;

        for (let next of this.queue) {
            if (next.status != MessageEnvelopStatuses.ready) continue;
            log.d('Publisher:tryBroadcastNext: trying to notify consumers on next message in line...', next, this.queue.length);
            this.onNew.emit(next);
            break;
        }
    }

    public async isLocked(message: MessageEnvelop<T>) {
        return message.status == MessageEnvelopStatuses.locked;
    }

    public async lock(message: MessageEnvelop<T>) {
        const m = this.map[message.id];
        if (m == null) return false;
        if (m.status != MessageEnvelopStatuses.ready) {
            // log.d('Publisher:lock: Message in not in "ready" state', message, this.name);
            return false;
        }
        m.status = MessageEnvelopStatuses.locked;

        setTimeout(() => this.tryBroadcastNext(), 0);

        return true;
    }

    public async ack(message: MessageEnvelop<T>) {
        const m = this.map[message.id];
        if (m.status != MessageEnvelopStatuses.locked) throw 'Publisher:ack: Can not ack message that is not in "locked" state';

        m.status = MessageEnvelopStatuses.acked;
        this.onAck.emit(message);
        delete this.map[message.id];

        await this.tryBroadcastNext();
    }

    public async reject(message: MessageEnvelop<T>) {
        const m = this.map[message.id];
        m.status = MessageEnvelopStatuses.ready;
    }
}
