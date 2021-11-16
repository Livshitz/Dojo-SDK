import { NoSqlStructure } from '..';

export interface IPersistencyManager<T = NoSqlStructure> {
    write(data: Object, compactJson?: Boolean);
    read(): Promise<T>;
}
