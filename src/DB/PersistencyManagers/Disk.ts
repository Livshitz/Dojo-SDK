import { libx } from 'libx.js/build/bundles/node.essentials';
import { NoSqlStructure, OBJ } from '..';
import fs from 'fs';
import { IPersistencyManager } from './IPersistencyManager';

export class DiskPersistencyManager<T = NoSqlStructure> implements IPersistencyManager<T> {
    constructor(private dbPath = './.tmp/db.json') {}

    public async write(data: Object, compactJson = true) {
        libx.node.mkdirRecursiveSync(this.dbPath);
        fs.writeFileSync(this.dbPath, libx.jsonify(data, compactJson));
    }

    public async read(): Promise<T> {
        if (!fs.existsSync(this.dbPath)) return null;
        libx.log.v('DiskPersistencyManager:read: Reading from local file...', this.dbPath);
        return libx.node.readJson(this.dbPath);
    }
}
