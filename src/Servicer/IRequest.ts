export enum RequestMethods {
    GET,
    POST,
    PUT,
    DELETE,
}

export interface IRequest {
    path: string;
    method: RequestMethods;
    headers?: {};
    query?: {};
    body?: {};
}
