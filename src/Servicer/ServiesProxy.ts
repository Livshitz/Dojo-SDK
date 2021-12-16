import { log } from 'libx.js/build/modules/log';
import { Master } from '../Master';
import { BasicServer, ModuleOptions as BasicServerOptions } from 'libx.js/build/node/BasicServer';
import { IRequest, RequestMethods, RequestX } from './Request';

export class ServiceProxy {
    private server: BasicServer;
    public constructor(private master: Master, public options?: Partial<ModuleOptions>) {
        this.options = { ...new ModuleOptions(), ...options };
    }

    public async init() {
        this.server = new BasicServer(this.options);
        this.server.mainRouter.route('/*').get(async (req, res) => {
            const { query, params, url, path, headers, method, body } = req;

            try {
                const r: IRequest = await this.master.request(new RequestX(url, RequestMethods[method], body));

                // res.json({ query, params, url, path, method, response: r?.response });
                res.json(r?.response);
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
}

export class ModuleOptions extends BasicServerOptions {}
