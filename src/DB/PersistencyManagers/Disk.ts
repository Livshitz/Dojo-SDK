import { libx } from 'libx.js/build/bundles/node.essentials';
import { NoSqlStructure, DTO } from '..';
import fs from 'fs';
import { IPersistencyManager } from './IPersistencyManager';
import { log } from 'libx.js/build/modules/log';
import { Callbacks } from 'libx.js/build/modules/Callbacks';
import { NotImplemented } from 'libx.js/src/helpers/Exceptions';

export type fileChangeCallback = (event: 'rename' | 'change', filename: string) => void;
export class DiskPersistencyManager<T = NoSqlStructure> implements IPersistencyManager<T> {
    public onChangeEvent = new Callbacks<{ event: 'rename' | 'change'; filename: string }>();
    private shouldIgnoreSelfChange = false;

    constructor(private dbPath = './.tmp/db.json', private isWatchLocalFile = false) {
        // libx.node.onExit(this.onTerminate.bind(this));
        libx.node.catchErrors();

        if (this.isWatchLocalFile) this.watch();
    }

    public async write(data: Object, compactJson = true) {
        this.shouldIgnoreSelfChange = true;
        libx.node.mkdirRecursiveSync(this.dbPath);
        fs.writeFileSync(this.dbPath, libx.jsonify(data, compactJson));
        setTimeout(() => (this.shouldIgnoreSelfChange = false), 50);
    }

    public async read(): Promise<T> {
        if (!fs.existsSync(this.dbPath)) return null;
        libx.log.v('DiskPersistencyManager:read: Reading from local file...', this.dbPath);
        const ret = libx.node.readJson(this.dbPath);
        return ret;
    }

    private async watch() {
        log.i('DiskPersistencyManager:watch: Starting watch db file', this.dbPath);
        fs.watch(this.dbPath, { recursive: true }, this.onFileChange.bind(this));
    }

    private onFileChange(event: 'rename' | 'change', filename: string) {
        if (this.shouldIgnoreSelfChange) return;
        this.onChangeEvent.trigger({ event, filename });
    }

    private async onTerminate(opts?: Object, exitCode?: number) {
        // TODO: This was commented out because it was moved from Database module and now it conflicts with the fact it does not have access to the data without the module itself calling it...
        throw new NotImplemented();

        /*
        if (opts != null && exitCode != null) {
            libx.log.v('DB:onTerminate: Program exited unexpectedly, avoiding write...', opts.toString(), exitCode.toString());
            return;
        }
        libx.log.v('DB:onTerminate: Saving...');
        await this.write(this.collections, this.options.compactJson);
        libx.log.v('DB:onTerminate: Saved');
        */
    }
}
