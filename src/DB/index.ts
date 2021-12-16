import { Mapping, ObjectLiteral } from 'libx.js/build/types/interfaces';
import { ObjectId } from 'libx.js/build/helpers/ObjectId';

export type ID = string;
export type FindPredicate<T = any> = (item: T, count?: number) => boolean;
export type DTO = {
    _id?: ID;
} & ObjectLiteral;
export type NoSqlStructure = Mapping<Mapping<DTO>>;

export function generateId() {
    return ObjectId.new();
}

export function idToDate(id: ID) {
    return ObjectId.toDate(id);
}
