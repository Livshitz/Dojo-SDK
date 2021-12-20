import { Callbacks } from 'libx.js/build/modules/Callbacks';
import { NoSqlStructure } from '..';

export interface IPersistencyManager<T = NoSqlStructure> {
    write(data: Object, compactJson?: Boolean);
    read(): Promise<T>;
    shutdown?(): Promise<void>;
    onChangeEvent?: Callbacks; //?();
}
