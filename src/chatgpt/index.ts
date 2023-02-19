// 提供可靠的 chatgpt 服务，失败自动重发，并识别提供服务器状态和提供状态接口

import {Api} from "./api";
import {isAxiosError} from "axios";

const status_sleep_map = {
    409: 60000,
    429: 60000,
    503: 10000,
}

export class Chatgpt {
    private readonly api: Api;
    private blocked_count: number;

    constructor(url: string) {
        this.api = new Api(url)
        this.blocked_count = 0
    }

    public async new_conversation(msg: string): Promise<string> {
        return this.try_request(async () => this.api.send(msg))
    }

    public async get_message(mid: string) {
        return this.try_request(async () => this.api.get(mid))
    }

    public async send_message(msg: string, id: string, mid: string): Promise<string> {
        return this.try_request(async () => this.api.send(msg, id, mid))
    }

    public async set_title(id: string, title: string) {
        return this.try_request(async () => this.api.set_title(id, title))
    }

    public is_blocking(): boolean {
        return this.blocked_count != 0
    }

    private async try_request(fn) {
        let blocked = false
        const release_block = () => {
            if (blocked) {
                this.blocked_count--
                blocked = false
            }
        }
        while (true) {
            let wait_ms: any
            try {
                const data = await fn()
                release_block()
                return data.data
            } catch (err) {
                if (!isAxiosError(err)) {
                    release_block()
                    throw err
                }
                if (err.response) {
                    wait_ms = status_sleep_map[err.response.status]
                    if (!wait_ms) {
                        release_block()
                        throw err
                    }
                }
            }
            if (!blocked) {
                this.blocked_count++
                blocked = true
            }
            await new Promise(resolve => setTimeout(resolve, wait_ms));
        }
    }
}