import { libx } from 'libx.js/build/bundles/browser.essentials';
import { log } from 'libx.js/build/modules/log';
import { Master } from './Master';
// import { IRequest, RequestX, RequestMethods, IResponse, ResponseTypes } from './Servicer/Request';
import { MemoryPersistencyManager } from './DB/PersistencyManagers/Memory';
import { SchedulerTypes } from './Scheduler/CronScheduler';
// import { SchedulerTypes } from './Scheduler/CronScheduler';
// import { BaseService } from './Servicer/BaseService';
// import { random } from 'faker';
import { RequestMethods, RequestX as Request, ResponseTypes } from './Servicer/Request';
import { BaseService } from './Servicer/BaseService';

if ((<any>window).dojo == undefined) (<any>window).dojo = {};
(<any>window).dojo = {
    master: new Master(),
    MemoryPersistencyManager,
    BaseService,
    SchedulerTypes,
    RequestMethods,
    Request,
    ResponseTypes,

    // faker: {
    //     random,
    // },

    libx,
    log,
};

log.isBrowser = true;
