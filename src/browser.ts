// import { libx } from 'libx.js/build/bundles/node.essentials';
// import { IScript } from 'libx.js/build/helpers/IScript';
// import { log } from 'libx.js/build/modules/log';
import { Master } from './Master';
// import { IRequest, RequestX, RequestMethods, IResponse, ResponseTypes } from './Servicer/Request';
// import { DiskPersistencyManager } from './DB/PersistencyManagers/Disk';
// import { SchedulerTypes } from './Scheduler/CronScheduler';
// import { BaseService } from './Servicer/BaseService';
// import faker from './Faker';

if ((<any>window).dojo == undefined) (<any>window).dojo = {};
(<any>window).dojo = {
    master: new Master(),
    // faker,

    // libx,
    // log,
};
