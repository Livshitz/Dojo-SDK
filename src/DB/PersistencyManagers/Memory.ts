import { log } from 'libx.js/build/modules/log';
import { NoSqlStructure } from '..';
import { IPersistencyManager } from './IPersistencyManager';

export class MemoryPersistencyManager<T = NoSqlStructure> implements IPersistencyManager<T> {
    private dbPath = './.tmp/db.json';

    public async write(data: Object, compactJson = true) {
        // log.v('MemoryPersistencyManager:write: writing DB', data);
    }

    public async read(): Promise<T> {
        return null;
    }
}
