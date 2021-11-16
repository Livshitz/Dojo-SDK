import { NoSqlStructure } from '..';
import { IPersistencyManager } from './IPersistencyManager';

export class MemoryPersistencyManager<T = NoSqlStructure> implements IPersistencyManager<T> {
    private dbPath = './.tmp/db.json';

    public async write(data: Object, compactJson = true) {}

    public async read(): Promise<T> {
        return null;
    }
}
