import { libx } from 'libx.js/build/bundles/node.essentials';
import { IScript } from 'libx.js/build/helpers/IScript';
import Program from 'libx.js/build/node/Program';
import { log } from 'libx.js/build/modules/log';
import { Orchestrator } from '../../Servicer/Orchestrator';
import { Service } from './Service';
import { IRequest, Request, RequestMethods } from '../../Servicer/Request';
import { IService } from '../../Servicer/IService';

log.isDebug = true;

const conf = {
    envs: {},
};

// $ node build/examples/Services/index.js
class Script implements IScript<typeof conf> {
    public async executeAsScript(config: typeof conf, env: string = Program.args.env, envConf): Promise<void> {
        // log.verbose('Script: Execute: ', 'config:', config, 'env:', env, 'envConf: ', envConf.baseUrl);

        const servicer = new Orchestrator(Service.new, 1, 10);
        await servicer.initiate();
        const pAll: Promise<any>[] = [];
        let start: Date;
        let duration: number;

        servicer.onBusy.subscribe((stats) => {
            log.d('onBusy', stats);
            start = new Date();
        });
        servicer.onIdle.subscribe((stats) => {
            duration = new Date().getTime() - start.getTime();
            log.d(`onIdle: Duration: ${duration}ms`, stats);
        });
        servicer.onAutoScale.subscribe(async (instances) => {
            // console.log('onAutoScale: instances:', instances);
            const stats = await servicer.getStats();
            // expect(stats).toMatchObject({ instancesCount: 1, busyInstances: 0 });
            if (instances == 1 && stats.pendingJobs == 0) {
                duration = new Date().getTime() - start.getTime();
                log.v(`onAutoScale: Scaled down to min, Duration: ${duration}ms`, stats);
            }
        });

        const input = await libx.node.prompts.readKey(async (k) => {
            if (k == 'i') {
                log.i('Inserting bulk messages');
                for (let i = 0; i < 100; i++) {
                    servicer.handleIncomingRequest(new Request('/myService/test?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'Bulk'));
                }
            } else if (k == 'a') {
                log.i('Inserting message A');
                servicer.handleIncomingRequest(new Request('/myService/test?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'A'));
            } else if (k == 'b') {
                log.i('Inserting message B');
                servicer.handleIncomingRequest(new Request('/myService/test?delay=' + libx.randomNumber(1000), RequestMethods.GET, 'B'));
            } else if (k == 'q') {
                log.i('quitting...');
                return false;
            }
        }, 'Press\n "i" to insert bulk messages,\n "a" to insert message A,\n "b" to insert message B,\n "q" to quit...');
        log.i('Keys pressed', input);

        return;
    }
}

if (libx.node.isCalledDirectly()) Program.run(new Script(), conf, Program.args.env || 'prod');
