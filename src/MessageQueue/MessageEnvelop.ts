import { libx } from 'libx.js/build/bundles/node.essentials';
import { Publisher } from './Publisher';

export class MessageEnvelop<T = any> {
    public status: MessageEnvelopStatuses;
    public id: string;

    constructor(public payload: T) {
        this.id = libx.newGuid(); //.substring(0, 3);
    }
}

export enum MessageEnvelopStatuses {
    ready,
    locked,
    acked,
}
