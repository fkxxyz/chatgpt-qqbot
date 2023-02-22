// 提供可靠的 chatgpt 服务，失败自动重发，并识别提供服务器状态和提供状态接口

import {Api} from "./api";
import {isAxiosError} from "axios";
import * as log4js from "log4js";

const status_sleep_map = {
    409: 60000,
    429: 60000,
    500: 10000,
    503: 10000,
}

export interface ReplyMsgInfo {
    id: string,
    mid: string,
    msg: string,
    end: boolean
}

export class Chatgpt {
    private readonly api: Api;
    private blocked_count: number;
    private logger: log4js.Logger;

    constructor(url: string) {
        this.api = new Api(url)
        this.blocked_count = 0
        this.logger = log4js.getLogger("thought");
    }

    public async new_conversation(msg: string): Promise<string> {
        const ret = await this.try_request(async () => this.api.send(msg))
        return ret.mid
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

    public async send_message(msg: string, id: string, mid: string): Promise<string> {
        const ret = await this.try_request(async () => this.api.send(msg, id, mid))
        return ret.mid
    }

    public async set_title(id: string, title: string) {
        return this.try_request(async () => this.api.set_title(id, title))
    }

    public is_blocking(): boolean {
        return this.blocked_count != 0
    }

    private async try_request(fn) {
        let blocked = false
        let isChatGPTError = false
        const release_block = () => {
            if (blocked) {
                this.blocked_count--
                blocked = false
                this.logger.error(`阻塞释放一个，阻塞数量： ${this.blocked_count}`)
            }
        }
        while (true) {
            let wait_ms = 10000
            try {
                const data = await fn()
                release_block()
                return data.data
            } catch (err) {
                if (!isAxiosError(err)) {
                    this.logger.error(err)
                    release_block()
                    throw err
                }
                if (err.response) {
                    this.logger.error("ChatGPT 服务器返回状态码 ", err.message)
                    if (isChatGPTError) {
                        wait_ms *= 2
                        if (wait_ms > 1200000)
                            wait_ms = 1200000
                    } else
                        wait_ms = status_sleep_map[err.response.status]
                    if (!wait_ms) {
                        release_block()
                        throw err
                    }
                    isChatGPTError = true
                } else {
                    this.logger.error("ChatGPT 服务器连接错误 ", err.message)
                    if (err.code == "ECONNREFUSED")
                        wait_ms = 10000
                    else {
                        wait_ms = 10000
                    }
                }
            }
            if (!blocked) {
                this.blocked_count++
                blocked = true
                this.logger.error(`请求进入阻塞状态，阻塞数量： ${this.blocked_count}`)
            }
            this.logger.error(`等待 ${wait_ms} 毫秒后重试 ...`)
            await new Promise(resolve => setTimeout(resolve, wait_ms));
        }
    }
}