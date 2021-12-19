// TODO: Deprecate

/*
import { libx } from 'libx.js/build/bundles/node.essentials';
import fs from 'fs';

enum OpLogType {
    Write,
    Update,
    Delete,
}

class OpLog {
    public timestamp: number;
    constructor(public collection: string, public key: string, public obj: Object) {
        this.timestamp = new Date().getTime();
    }
}

export class PersistencyManager_Smart {
    private dbPath = './.tmp/db/';
    private ext = 'json';
    private buffer = {};
    private opLog: OpLog[] = [];
    private debounceWrite = libx.debounce(
        () => {
            for (let item of this.opLog) {
                const p = this.dbPath + item.collection;
                libx.node.mkdirRecursiveSync(p);
                fs.writeFileSync(`${p}/${item.key}.${this.ext}`, libx.jsonify(item.obj));
            }
        },
        500,
        false,
        true
    );

    constructor() {
        libx.node.mkdirRecursiveSync(this.dbPath);
    }

    public write(collection: string, key: string, content: object) {
        // fs.writeFileSync(this.dbPath + path + this.ext, libx.jsonify(content));
        // const obj = libx.getObjectByPath(path, this.buffer);
        if (content == null) return;
        const col = this.buffer[collection] || (this.buffer[collection] = {});
        if (key == null) return col;
        // const obj = content[key];
        // if (obj == null) return null;
        // if (obj.isProxy) return null;
        // col[key] = obj;
        this.opLog.push(new OpLog(collection, key, content));
        this.debounceWrite();
    }

    public read(path: string, key: string) {
        let col = this.buffer[path];
        if (col == null) {
            if (libx.isEmptyObject(this.buffer)) {
                fs.readdirSync(this.dbPath).map((x) => (this.buffer[x] = {}));
            } else this.buffer[path] = {};
            col = this.buffer[path];
        }
        if (key == null) return col;
        let ret = col[key];
        if (ret == null) {
            ret = col[key] = fs.readFileSync(`${this.dbPath}/${path}/${key}.${this.ext}`)?.toJSON();
        }

        return ret;

        // const p = this.dbPath + path + this.ext;
        // if (!fs.existsSync(p)) {
        //     libx.node.mkdirRecursiveSync(this.dbPath);
        //     fs.writeFileSync(p, JSON.stringify({}));
        //     return {};
        // }
        // return JSON.parse(fs.readFileSync(p).toString());
    }
}

*/
