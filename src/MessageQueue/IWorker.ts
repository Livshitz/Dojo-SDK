import { MessageEnvelop } from './MessageEnvelop';

export interface IWorker<T = any> {
    treat: (item: MessageEnvelop<T>, instanceIdentifier: String) => Promise<void> | void;
}
