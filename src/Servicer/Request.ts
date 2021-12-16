import { Deferred } from 'libx.js/src/types/interfaces';
import { ID, generateId } from '../DB';

export enum RequestMethods {
    GET,
    POST,
    PUT,
    DELETE,
}

export interface IRequest {
    reqId: ID;
    path: string;
    method: RequestMethods;
    headers?: {};
    query?: {};
    body?: {} | string;
    response?: {};
    promise?: Deferred<IRequest>;
    createdAt: Date;
    getAgeMS: () => number;
}

export class RequestX implements IRequest {
    reqId: string;
    path: string;
    method: RequestMethods;
    headers?: {};
    query?: {};
    body?: string | {};
    response?: {};
    promise?: Deferred<IRequest, any>;
    createdAt: Date;

    constructor(path: string, method: RequestMethods, body?: {} | string) {
        this.reqId = generateId();
        this.createdAt = new Date();
        this.path = path;
        this.method = method;
        this.body = body;
    }

    public getAgeMS() {
        return new Date().getTime() - this.createdAt.getTime();
    }
}
