import { IRequest, IResponse } from './Request';

export interface IService<T = any> {
    id?: String;

    bootstrap?: () => void;
    handle: (request: IRequest, res?: IResponse) => Promise<T> | T;
    teardown?: () => void;
    getIsBusy?: () => Promise<boolean>;

    createdAt?: Date;
}
