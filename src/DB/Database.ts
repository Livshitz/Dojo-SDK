import { libx } from 'libx.js/build/bundles/node.essentials';
import { Callbacks } from 'libx.js/build/modules/Callbacks';
import DeepProxy from 'libx.js/build/modules/DeepProxy';
import { DynamicProps, ObjectLiteral, Mapping, Deferred } from 'libx.js/src/types/interfaces';
import { FindPredicate, generateId, ID, NoSqlStructure, OBJ } from '.';
import { IPersistencyManager } from './PersistencyManagers/IPersistencyManager';
import { MemoryPersistencyManager } from './PersistencyManagers/Memory';
// import { PersistencyManager } from './PersistencyManagers/Disk';

export class Database {
    private collections: NoSqlStructure = null;
    public onReady: Deferred = libx.newPromise();
    public options: ModuleOptions;

    constructor(options?: Partial<ModuleOptions>) {
        this.options = { ...new ModuleOptions(), ...options };

        this.onReady.then(this.onReady_cb);
        this.onStart();
        if (this.options.persistOnTerminate) libx.node.onExit(this.onTerminate.bind(this));
        libx.node.catchErrors();
    }

    public async get<T extends OBJ>(collection: string, id: ID) {
        this.checkDataReady();
        let col = this.collections[collection];
        if (col == null) {
            col = this.collections[collection] = {};
        }
        return col[id] as T;
    }

    public async find<T extends OBJ>(collection: string, predicate: FindPredicate) {
        this.checkDataReady();
        const col = this.collections[collection];
        const res = [];
        for (let key in col) {
            const item = col[key];
            if (predicate(item as T, res.length)) res.push(item);
        }
        if (res.length == 0) return null;
        return res;
    }

    public async findOne<T extends OBJ>(collection: string, predicate: FindPredicate) {
        this.checkDataReady();
        return this.find<T>(collection, (x, count) => count < 1 && predicate(x, count));
    }

    public async resetDB() {
        await this.options.persistencyManager.write({}, this.options.compactJson);
    }

    public async write<T extends OBJ>(collection: string, obj: T) {
        this.checkDataReady();
        await this.createCollectionIfMissing(collection);

        if (obj._id == null) obj._id = generateId();
        this.collections[collection][obj._id] = obj;
        return obj._id;
    }

    public async update<T extends OBJ>(collection: string, id: ID, subset: Partial<T>) {
        this.checkDataReady();
        await this.createCollectionIfMissing(collection);

        const col = this.collections[collection];
        return (col[id] = libx.ObjectHelpers.merge(col[id], subset));
    }

    public async delete(collection: string, id: ID) {
        this.checkDataReady();
        const col = this.collections[collection];
        delete col[id];
    }

    private async onStart() {
        libx.log.d('DB: onStart');
        if (this.options.initialData == null) {
            this.collections = (await this.options.persistencyManager.read()) || {};
        } else {
            await this.options.persistencyManager.write(this.options.initialData, this.options.compactJson);
            this.collections = this.options.initialData;
        }
        this.onReady.resolve();
    }

    private async onReady_cb() {
        libx.log.d('DB: onReady');
    }

    private async onTerminate(opts?: Object, exitCode?: number) {
        libx.log.v('DB:onTerminate: Saving...');
        await this.options.persistencyManager.write(this.collections, this.options.compactJson);
        libx.log.v('DB:onTerminate: Saved');
    }

    private async createCollectionIfMissing(name: string) {
        if (this.collections[name] == null) {
            return (this.collections[name] = {});
        }
    }

    private checkDataReady() {
        if (this.collections != null) return true;
        throw 'LocalDatabase: Data not ready, use `.onReady promise to await for it`';
    }
}

export class ModuleOptions {
    public persistOnTerminate = true;
    public compactJson = false;
    public persistencyManager: IPersistencyManager = new MemoryPersistencyManager();
    public initialData: NoSqlStructure;
}
