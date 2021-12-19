import { log } from 'libx.js/build/modules/log';
import { Master } from '../Master';
import { BasicServer, ModuleOptions as BasicServerOptions } from 'libx.js/build/node/BasicServer';
import { IRequest, IResponse, RequestMethods, RequestX, ResponseTypes } from './Request';

/**
 * This module starts a basic server so you can send requests to and it then passes it to the simulated Services in the Orchestrator.
 */
export class ServiceProxy {
    private server: BasicServer;
    public constructor(private master: Master, public options?: Partial<ModuleOptions>) {
        this.options = { ...new ModuleOptions(), ...options };
    }

    public async init() {
        this.server = new BasicServer(this.options);
        this.server.mainRouter.route('/*').get(async (req, res) => {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const { query, params, url, path, headers, method, body } = req;

            try {
                const newReq = new RequestX(url, RequestMethods[method], body);
                newReq.headers = headers || {};
                newReq.headers['ip'] = ip;
                const r: IResponse = <IResponse>{}; //await this.master.request(newReq);

                // res.json({ query, params, url, path, method, response: r?.response });
                res.status(this.responseTypeToHttpStatusCode(r.type)).json(r).send();
            } catch (ex) {
                const errObj = { query, params, url, path, method, error: ex.toString() };
                log.error('ServiceProxy: Error in request', errObj);
                res.json(errObj).status(400);
            }
        });

        await this.server.init();
    }

    public close() {
        this.server.close();
    }

    private responseTypeToHttpStatusCode(responseType: ResponseTypes) {
        if (responseType == null) return 200;
        switch (responseType) {
            case ResponseTypes.OK:
                return 200;
            case ResponseTypes.InputError:
                return 400;
            case ResponseTypes.ServerError:
                return 500;
            case ResponseTypes.Forbidden:
                return 403;
            case ResponseTypes.Moved:
                return 302;
            case ResponseTypes.NotAuthorized:
                return 401;
            case ResponseTypes.NotFound:
                return 404;
            case ResponseTypes.RateLimit:
                return 429;
        }
    }
}

export class ModuleOptions extends BasicServerOptions {}
