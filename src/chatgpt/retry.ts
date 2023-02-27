import {AxiosResponse, isAxiosError} from "axios";
import {ProcessQueue} from "../queue";
import * as log4js from "log4js";


interface SleepStrategy {
    start: number,
    growth: number,
    upper: number,
}

const status_sleep_map: { [key: number]: SleepStrategy } = {
    409: {
        start: 10000,
        growth: 2,
        upper: 1200000,
    },
    429: {
        start: 30000,
        growth: 2,
        upper: 1200000,
    },
    500: {
        start: 10000,
        growth: 1,
        upper: 10000,
    },
    503: {
        start: 10000,
        growth: 1,
        upper: 10000,
    },
}

const default_sleep_strategy: SleepStrategy = {
    start: 10000,
    growth: 2,
    upper: 20000,
}

export class TryRequestQueue {
    private queue: ProcessQueue;
    private logger: log4js.Logger;
    private blocking: boolean;

    constructor(logger: log4js.Logger) {
        this.queue = new ProcessQueue()
        this.logger = logger
        this.blocking = false
    }

    public is_blocking(): boolean {
        return this.blocking
    }

    protected async try_request(request: () => Promise<AxiosResponse<any, any>>): Promise<any> {
        return this.queue.process(async (): Promise<string> => {
            let wait_ms: number = undefined
            while (true) {
                try {
                    const data = await request()
                    this.blocking = false
                    return data.data
                } catch (err) {
                    if (!isAxiosError(err)) {
                        this.logger.error(err)
                        throw err
                    }

                    // 得到等待策略
                    let sleep_strategy: SleepStrategy
                    if (err.response) {
                        this.logger.error("ChatGPT 服务器返回状态码 ", err.message)
                        this.logger.error("ChatGPT 服务器返回响应 ", err.response.data)
                        sleep_strategy = status_sleep_map[err.response.status]
                        if (!sleep_strategy)
                            sleep_strategy = default_sleep_strategy
                    } else {
                        this.logger.error("ChatGPT 服务器连接错误 ", err.message)
                        sleep_strategy = default_sleep_strategy
                    }

                    // 根据策略计算出等待的时间
                    if (!wait_ms)
                        wait_ms = sleep_strategy.start
                    else
                        wait_ms *= sleep_strategy.growth
                    if (wait_ms > sleep_strategy.upper)
                        wait_ms = sleep_strategy.upper
                }
                this.blocking = true
                this.logger.error(`等待 ${wait_ms} 毫秒后重试 ...`)
                await new Promise(resolve => setTimeout(resolve, wait_ms));
            }
        })
    }
}
