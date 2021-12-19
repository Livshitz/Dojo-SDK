import { Deferred, DynamicProperties } from 'libx.js/src/types/interfaces';
import { ID, generateId } from '../DB';

export enum RequestMethods {
    GET,
    POST,
    PUT,
    DELETE,
}

export enum ResponseTypes {
    OK, // 200
    InputError, // 400
    ServerError, // 500
    NotFound, // 404
    RateLimit, // 429
    NotAuthorized, // 401
    Forbidden, // 403
    Moved, // 302
}
export interface IRequest<T = any | {}> {
    reqId: ID;
    path: string;
    method: RequestMethods;
    headers?: DynamicProperties;
    query?: {};
    body?: T | string;
    promise?: Deferred<IResponse>;
    createdAt: Date;
    getAgeMS: () => number;
}

export interface IResponse<T = any | {}> {
    headers?: {};
    type: ResponseTypes;
    body: T;
}

export class RequestX implements IRequest {
    reqId: string;
    path: string;
    method: RequestMethods;
    headers?: {};
    query?: {};
    body?: string | {};
    response?: {};
    promise?: Deferred<IResponse, any>;
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
