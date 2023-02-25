// 提供可靠的 chatgpt 服务，失败自动重发，并识别提供服务器状态和提供状态接口

import {Api} from "./api";
import * as log4js from "log4js";
import {Account} from "./account";
import {TryRequestQueue} from "./retry";


export interface ReplyMsgInfo {
    id: string,
    mid: string,
    msg: string,
    end: boolean
}

export class Chatgpt extends TryRequestQueue {
    private readonly api: Api;
    private readonly accounts: { [key: string]: Account };

    constructor(url: string) {
        const logger = log4js.getLogger("chatgpt")
        super(logger)
        this.api = new Api(url)
        this.accounts = {}
    }

    public account(account_id: string): Account {
        let account = this.accounts[account_id]
        if (!account) {
            account = new Account(this.api, account_id)
            this.accounts[account_id] = account
        }
        return account
    }

    public async get_message(mid: string): Promise<ReplyMsgInfo> {
        const ret = await this.try_request(async () => this.api.get(mid))
        return {
            id: ret.conversation_id as string,
            mid: ret.message.id as string,
            msg: ret.message.content.parts[0] as string,
            end: ret.finished as boolean,
        }
    }
}