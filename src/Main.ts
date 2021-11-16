import { log } from 'libx.js/build/modules/log';
import DeepProxy from 'libx.js/build/modules/DeepProxy';
import { libx } from 'libx.js/build/bundles/node.essentials';
import { MessageQueueManager } from './MessageQueue/MessageQueueManager';
import { Publisher } from './MessageQueue/Publisher';
import { Consumer } from './MessageQueue/Consumer';
import { CronScheduler } from './Scheduler/CronScheduler';
import { ScheduleFormatParser } from './Scheduler/ScheduleFormatParser';
import { Database } from './DB/Database';
import { Key } from 'libx.js/src/types/interfaces';
import fs from 'fs';
import Exception from 'libx.js/build/helpers/Exceptions';
import { DiskPersistencyManager } from './DB/PersistencyManagers/Disk';

export default class App {
    constructor() {}

    public async run() {
        // log.isDebug = true;

        const testScheduler = async () => {
            const cronSchedule = '*/5    *    *    *    *    *'; //'42 * * * *';
            // const res = ScheduleFormatParser.parseCronFormat(cronSchedule);
            const s = new CronScheduler();
            s.scheduleOnce(cronSchedule, async () => {
                console.log('Single tick!');
            });
            const p = s.scheduleRepeating(cronSchedule, async () => {
                console.log('!!! Recurring tick!!!');
            });
            await p;
        };

        const testDBLoad = async () => {
            const db = new Database();
            const col = 'myCollection';
            const amount = 1000000;
            log.v('write: start');
            libx.measure('write_time');
            const pAll = [];
            for (let i = 0; i <= amount; i++) {
                await db.write(col, { a: i, i });
                // pAll.push(db.write(col, { a: i, i }));
                // console.log(id);
            }
            // await Promise.all(pAll);
            log.v('write: done', libx.getMeasure('write_time'));
            libx.measure('find_time');
            const a = new Date();
            log.v('find: start');
            const found = await db.find(col, (x) => x.i == amount);
            log.v('find: done');
            const dur = libx.getMeasure('find_time');
            console.log('dur: ', dur);
        };
        const testDB = async () => {
            const db = new Database();
            const col = 'myCollection';
            /*
            const id = await db.write(col, {
                a: 1,
                b: 2,
            });
            await db.update(col, id, { b: 22 });
            const res = await db.get(col, id);
            console.log('DB: res: ', res);
            await db.update(col, id, { c: 33 });
            const found = await db.find(col, (x) => x.b == 22);
            console.log('DB: found: ', found);
            await db.write(col, {
                a: 111,
                b: 222,
            });
            */

            const id = '617c6c3cd83a01644d23651e';
            const found = await db.get(col, id);
            console.log('DB: found: ', found);
            const updated = await db.update(col, id, { b: 22 });
            console.log('DB: updated: ', found);
        };

        const getLocalFile = (collection: string, id: string) => {
            const dbPath = '.tmp/db';
            const ext = '.json';
            const path = `${dbPath}${collection}/${id}${ext}`;
            if (!fs.existsSync(path)) return null;
            return libx.node.readJson(path);
        };
        const saveToLocalFile = (collection: string, id: string, content: Object) => {
            if (content == null) throw new Exception('saveToLocalFile: Content argument cannot be null!');
            const dbPath = '.tmp/db';
            const ext = '.json';
            const path = `${dbPath}/${collection}/${id}${ext}`;
            // if (!fs.existsSync(path)) return null;
            const data = libx.jsonify(content, true);
            return fs.writeFileSync(path, data);
        };
        const testProxy = async () => {
            const fs = {
                // a: 1,
                // b: 2,
                // c: 3,
                // d: { da: 11, db: 22 },
                // myCollection: {
                //     '617c6c3cd83a01644d23651e': {
                //         a: 1,
                //         b: 2,
                //     },
                // },
            };
            const mem = { this_is_mem: true };
            const collectionsProxy = DeepProxy.create<any>(
                mem,
                {
                    get: (target, path, key) => {
                        if (key == 'toJSON') return null;
                        const deepPath = (path + '/' + key.toString()).substr(1);
                        const [collection, id, ...rest] = deepPath.split('/');
                        const sep = deepPath.lastIndexOf('/') == -1 ? 0 : deepPath.lastIndexOf('/');
                        const parentPath = deepPath.slice(0, sep);
                        let reflected = libx.getDeep(fs, parentPath);
                        if (reflected == null || reflected[key] == null) {
                            libx.spawnHierarchy(deepPath, fs, null, '/');
                            reflected = libx.getDeep(fs, parentPath);
                        }
                        if (reflected[key] == null && path != '') {
                            reflected[key] = getLocalFile(path, key.toString());
                            const prox = libx.getDeep(collectionsProxy, parentPath) || collectionsProxy;
                            prox[key] = reflected[key];
                        }
                        if (collection != null && id == null) reflected[key] = {};

                        // console.log('proxy: get', path, key, target, parentPath, reflected);

                        let memObj = libx.getDeep(mem, parentPath);
                        if (memObj == null) {
                            memObj = mem;
                        }
                        if (reflected == null) return null;
                        if (memObj[key] == null) {
                            // memObj[key] = reflected;
                            collectionsProxy[key] = reflected[key];
                        }
                        if (path == '') return null;
                    },
                    preSet: (target, path, key, value) => {
                        const deepPath = (path + '/' + key.toString()).substr(1);
                        const [collection, id, ...rest] = deepPath.split('/');

                        const sep = deepPath.lastIndexOf('/') == -1 ? 0 : deepPath.lastIndexOf('/');
                        const parentPath = deepPath.slice(0, sep);
                        const reflected = libx.getDeep(fs, parentPath) || fs;
                        console.log('proxy: set', path, key, value, target, parentPath, reflected);

                        if (path == '') return;

                        const oldHash = libx.getObjectHash(reflected[key]);
                        reflected[key] = value;
                        const newHash = libx.getObjectHash(value);
                        if (collection != null && id != null && oldHash != newHash && fs[collection][id] != null && oldHash != '') {
                            console.log('saving to local: ', collection, id, value);
                            saveToLocalFile(collection, id, fs[collection][id]);
                        }

                        return true;
                    },
                },
                true
            );

            console.log('x: ', collectionsProxy.myCollection['617c6c3cd83a01644d23651e'].a);

            throw 'x';

            // const x = collectionsProxy.myCollection['617c6c3cd83a01644d23651e'];
            // x.a = libx.randomNumber(10000);
            // await libx.delay(1000);
            // x.b = libx.randomNumber(10000);
            // console.log('x: ', x);
            // console.log(collectionsProxy.myCollection['617c6c3e2f05f49832874e96']);

            // const t = collectionsProxy.d.da;
            // console.log('collectionsProxy.d: ', collectionsProxy.d);
            // collectionsProxy.d.da = 12;
            // collectionsProxy.d.dc = 31;
            // collectionsProxy.d.dc = 32;
            // collectionsProxy.d.dc = 33;
            // mem['b'] = 2222;
            // fs.b = 222;
            // collectionsProxy.x = {
            //     aa: 1,
            //     bb: 2,
            // };
            // collectionsProxy.b = 22;
            // console.log('collectionsProxy.d.da: ', collectionsProxy.d.da);
            // collectionsProxy.c = 333;
            // console.log('collectionsProxy.c: ', collectionsProxy.c);

            // collectionsProxy.p = {
            //     aa: 101,
            // };
            // collectionsProxy.p.aa = 202;

            console.log('proxy: ', libx.jsonify(collectionsProxy, false));
            // console.log('mem: ', libx.jsonify(mem, false));
            // console.log('fs: ', libx.jsonify(fs, false));
        };

        const testLocalDB = async () => {
            const db = new Database({ persistencyManager: new DiskPersistencyManager() });
            await db.onReady;
            const col = 'col';

            console.log('reading...');
            console.log(await db.get(col, '618230709af3ade104bee1ff'));
            console.log('writing...');
            // for (let i = 0; i < 10000; i++) {
            //     const newId = await db.write(col, { a: libx.randomNumber(1000) });
            //     console.log('wrote: ', newId);
            // }

            console.log('finding...');
            const res = await db.find(col, (x) => x.a >= 5);
            console.log('res: ', res);
        };

        // await testScheduler();
        // await testDB();
        // await testProxy();
        await testLocalDB();

        // Grace period:
        await libx.node.prompts.waitForAnyKey();
        log.i('Key pressed');
    }
}

class MyItem {
    public str: string;
    public num: number;
}

class Program {
    public static async main() {
        let error: Error = null;

        try {
            console.log('----------------');
            let app = new App();
            await app.run();
            console.log('DONE');
        } catch (err) {
            error = err;
        } finally {
            let errorCode = 0;
            if (error) {
                console.error('----- \n [!] Failed: ', error);
                errorCode = 1;
            }

            if (require.main === module) libx.node.cleanExit();
        }
    }
}

if (libx.node.isCalledDirectly()) Program.main(); // Comment if you don't want to use this file as node script and self execute
