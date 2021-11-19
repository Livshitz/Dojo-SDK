import { IRequest } from './Request';

export interface IService<T = any> {
    id: String;

    bootstrap: () => void;
    handle: (request: IRequest) => Promise<T>;
    teardown: () => void;
    getIsBusy: () => Promise<boolean>;
    getThroughput: () => Promise<number>;

    createdAt: Date;
}
