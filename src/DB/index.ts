import { Mapping, ObjectLiteral } from 'libx.js/src/types/interfaces';

export type ID = string;
export type FindPredicate<T = any> = (item: T, count?: number) => boolean;
export type OBJ = {
    _id?: ID;
} & ObjectLiteral;
export type NoSqlStructure = Mapping<Mapping<OBJ>>;

export function generateId() {
    // return libx.newGuid(false);
    // return libx.randomNumber(1000000);
    var timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
    return (
        timestamp +
        'xxxxxxxxxxxxxxxx'
            .replace(/[x]/g, function () {
                return ((Math.random() * 16) | 0).toString(16);
            })
            .toLowerCase()
    );
}

export function idToTimestamp(id: ID) {
    return new Date(parseInt(id.substring(0, 8), 16) * 1000);
}
