import { libx } from 'libx.js/build/bundles/browser.essentials';
import { log } from 'libx.js/build/modules/log';
import { Matrix } from './Matrix';
import { MemoryPersistencyManager } from './DB/PersistencyManagers/Memory';
import { SchedulerTypes } from './Scheduler/CronScheduler';
// import { random } from 'faker';
import { RequestMethods, RequestX as Request, ResponseTypes } from './Servicer/Request';
import { BaseService } from './Servicer/BaseService';
import { ObjectId } from 'libx.js/build/helpers/ObjectId';

if ((<any>window).dojo == undefined) (<any>window).dojo = {};
(<any>window).dojo = {
    matrix: new Matrix(),
    MemoryPersistencyManager,
    BaseService,
    SchedulerTypes,
    RequestMethods,
    Request,
    ResponseTypes,
    ObjectId,

    // faker: {
    //     random,
    // },

    libx,
    log,
};

log.isBrowser = true;
