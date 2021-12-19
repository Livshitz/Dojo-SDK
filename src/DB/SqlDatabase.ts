import { libx } from 'libx.js/build/bundles/node.essentials';
import { Callbacks } from 'libx.js/build/modules/Callbacks';
import DeepProxy from 'libx.js/build/modules/DeepProxy';
import { DynamicProps, ObjectLiteral, Mapping, Deferred } from 'libx.js/build/types/interfaces';
import { NotImplemented } from 'libx.js/build/helpers/Exceptions';
import { FindPredicate, generateId, ID, NoSqlStructure, DTO } from '.';
import { DiskPersistencyManager } from './PersistencyManagers/Disk';
import { IPersistencyManager } from './PersistencyManagers/IPersistencyManager';
import { MemoryPersistencyManager } from './PersistencyManagers/Memory';

// TODO: Implement SqlDatabase. Is it justified? Or NoSqlDatabase could be generally considered as good fit for SQL DB simulations as well?

export class SqlDatabase {
    private collections: NoSqlStructure = null;
    public onReady: Deferred = libx.newPromise();
    public options: ModuleOptions;

    constructor(options?: Partial<ModuleOptions>) {
        throw NotImplemented;
        this.options = { ...new ModuleOptions(), ...options };

        this.onReady.then(this.onReady_cb);
        this.onStart();
        if (this.options.persistOnTerminate) libx.node.onExit(this.onTerminate.bind(this));
        libx.node.catchErrors();

        this.options.persistencyManager.onChangeEvent?.subscribe(this.onDbExternalChange.bind(this));
    }

    public async resetDB() {
        throw NotImplemented;
        await this.options.persistencyManager.write({}, this.options.compactJson);
    }

    private async onStart() {
        throw NotImplemented;
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
        throw NotImplemented;
        libx.log.d('DB: onReady');
    }

    private async onTerminate(opts?: Object, exitCode?: number) {
        throw NotImplemented;
        if (opts != null && exitCode != null) {
            libx.log.v('DB:onTerminate: Program exited unexpectedly, avoiding write...', opts.toString(), exitCode.toString());
            return;
        }
        libx.log.v('DB:onTerminate: Saving...');
        await this.options.persistencyManager.write(this.collections, this.options.compactJson);
        libx.log.v('DB:onTerminate: Saved');
    }

    private checkDataReady() {
        throw NotImplemented;
        if (this.collections != null) return true;
        throw 'LocalDatabase: Data not ready, use `.onReady promise to await for it`';
    }

    private async tryContinuosWrite() {
        throw NotImplemented;
        if (!this.options.continuosWrite) return;

        await this.options.persistencyManager.write(this.collections, this.options.compactJson);
    }

    private async onDbExternalChange() {
        throw NotImplemented;
        libx.log.v('Database:onDbExternalChange: file changed!');
        this.collections = await this.options.persistencyManager.read();
    }
}

export class ModuleOptions {
    public persistOnTerminate = true;
    public compactJson = false;
    public persistencyManager: IPersistencyManager = new MemoryPersistencyManager();
    public initialData: NoSqlStructure;
    public continuosWrite = false;
}
