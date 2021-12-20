import { libx } from 'libx.js/build/bundles/essentials';
import { Callbacks } from 'libx.js/build/modules/Callbacks';
import DeepProxy from 'libx.js/build/modules/DeepProxy';
import { DynamicProps, ObjectLiteral, Mapping, Deferred } from 'libx.js/build/types/interfaces';
import { FindPredicate, generateId, ID, NoSqlStructure, DTO } from '.';
import { IPersistencyManager } from './PersistencyManagers/IPersistencyManager';
import { MemoryPersistencyManager } from './PersistencyManagers/Memory';

export class Database {
    private collections: NoSqlStructure = null;
    public onReady: Deferred = libx.newPromise();
    public options: ModuleOptions;

    constructor(options?: Partial<ModuleOptions>) {
        this.options = { ...new ModuleOptions(), ...options };

        this.onReady.then(this.onReady_cb);
        this.onStart();

        this.options.persistencyManager.onChangeEvent?.subscribe(this.onDbExternalChange.bind(this));
    }

    public async get<T extends DTO>(collection: string, id: ID) {
        this.checkDataReady();
        let col = this.collections[collection];
        if (col == null) {
            col = this.collections[collection] = {};
        }
        return col[id] as T;
    }

    public async find<T extends DTO>(collection: string, predicate: FindPredicate<T>) {
        this.checkDataReady();
        const col = this.collections[collection];
        const res: T[] = [];
        for (let key in col) {
            const item = <T>col[key];
            if (predicate(item as T, res.length)) {
                item._id = key;
                res.push(item);
            }
        }
        if (res.length == 0) return null;
        return res;
    }

    public async findOne<T extends DTO>(collection: string, predicate: FindPredicate<T>) {
        this.checkDataReady();
        return this.find<T>(collection, (x, count) => count < 1 && predicate(x, count));
    }

    public async resetDB() {
        await this.options.persistencyManager.write({}, this.options.compactJson);
    }

    public async insert<T extends DTO>(collection: string, obj: T) {
        this.checkDataReady();
        await this.createCollectionIfMissing(collection);

        if (obj._id == null) obj._id = generateId();
        this.collections[collection][obj._id] = obj;

        this.tryContinuosWrite();

        return obj._id;
    }

    public async update<T extends DTO>(collection: string, id: ID, subset: Partial<T>) {
        this.checkDataReady();
        await this.createCollectionIfMissing(collection);

        const col = this.collections[collection];
        col[id] = libx.ObjectHelpers.merge(col[id], subset);

        this.tryContinuosWrite();
        return col[id];
    }

    public async delete(collection: string, id: ID) {
        this.checkDataReady();
        const col = this.collections[collection];
        delete col[id];
        this.tryContinuosWrite();
    }

    public async shutdown() {
        await this.options.persistencyManager?.shutdown();
    }

    private async onStart() {
        libx.log.d('DB: onStart');
        if (this.options.initialData == null) {
            this.collections = (await this.options.persistencyManager.read()) || {};
        } else {
            const existing = await this.options.persistencyManager.read();
            const merged = { ...existing, ...this.options.initialData };
            await this.options.persistencyManager.write(merged, this.options.compactJson);
            this.collections = merged;
        }
        this.onReady.resolve();
    }

    private async onReady_cb() {
        libx.log.d('DB: onReady');
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

    private async tryContinuosWrite() {
        if (!this.options.continuosWrite) return;

        await this.options.persistencyManager.write(this.collections, this.options.compactJson);
    }

    private async onDbExternalChange() {
        libx.log.v('Database:onDbExternalChange: file changed!');
        this.collections = await this.options.persistencyManager.read();
    }
}

export class ModuleOptions {
    public compactJson = false;
    public persistencyManager: IPersistencyManager = new MemoryPersistencyManager();
    public initialData: NoSqlStructure;
    public continuosWrite = false;
}
