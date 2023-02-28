import {Api} from "./api";
import * as log4js from "log4js";
import {TryRequestQueue} from "./retry";
import assert = require("node:assert");


export class Account extends TryRequestQueue {
    private readonly api: Api;
    private readonly id: string;

    constructor(api: Api, account_id: string) {
        const logger = log4js.getLogger("chatgpt/" + account_id);
        super(logger);
        this.api = api
        this.id = account_id
    }

    // 新建会话，返回新消息的mid
    public async new_conversation(msg: string): Promise<string> {
        const data = await this.try_request(() => this.api.send(this.id, msg))
        const new_mid = data.mid
        assert(typeof new_mid == "string")
        return new_mid
    }

    // 发送消息，返回新消息的mid
    public async send_message(msg: string, id: string, mid: string): Promise<string> {
        const data = await this.try_request(() => this.api.send(this.id, msg, id, mid))
        const new_mid = data.mid
        assert(typeof new_mid == "string")
        return new_mid
    }

    // 设置标题
    public async set_title(id: string, title: string): Promise<any> {
        return this.try_request(() => this.api.set_title(this.id, id, title))
    }

    // 获取历史记录
    public async history(id: string): Promise<any> {
        return this.try_request(() => this.api.history(this.id, id))
    }
}