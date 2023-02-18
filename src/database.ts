// Database 提供 key-value 数据库服务

import {Buffer} from "buffer";
import * as fs from "fs";
import path = require("node:path");

export class Database {
    private readonly root: string;

    constructor(root: string) {
        this.root = root
    }

    get(key: string): Buffer {
        return fs.readFileSync(path.join(this.root, key))
    }

    get_object<T>(key: string): T {
        return JSON.parse(fs.readFileSync(path.join(this.root, key), 'utf-8')) as T
    }

    set(key: string, value: Buffer) {
        fs.writeFileSync(path.join(this.root, key), value)
    }

    set_object<T>(key: string, value: T) {
        fs.writeFileSync(path.join(this.root, key), JSON.stringify(value), 'utf-8')
    }
}
