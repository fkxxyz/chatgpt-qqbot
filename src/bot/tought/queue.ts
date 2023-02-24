import * as log4js from "log4js";

class Queue<T> {
    private readonly items: T[];

    constructor() {
        this.items = [];
    }

    public append(element) {
        this.items.push(element);
    }

    public pop() {
        return this.items.shift();
    }

    public length() {
        return this.items.length;
    }

    public head() {
        return this.items[0];
    }
}

interface Request {
    id: number,

    process(): Promise<any>,
}

export class RequestQueue {
    private readonly queue: Queue<Request>;
    private activate: Function;
    private map: { [key: number]: null };
    private logger: log4js.Logger;

    constructor() {
        this.queue = new Queue<Request>()
        this.activate = () => {
        }
        this.logger = log4js.getLogger("queue");
        this.map = {}
        this.main_loop().then()
    }

    public append(request: Request) {
        this.logger.info(`队列新增请求 ${request.id}`)
        this.queue.append(request)
        this.map[request.id] = null
        this.logger.info(`队列长度： ${this.queue.length()}`)
        this.activate()
    }

    public has(id: number) {
        return this.map[id] !== undefined
    }

    private async main_loop() {
        while (true) {
            this.logger.info(`队列长度： ${this.queue.length()}`)
            if (this.queue.length() == 0) {
                this.logger.info(`队列空闲，等待请求...`)
                await new Promise((resolve, rejects) => {
                    this.activate = resolve
                })
            }

            // 开始处理最头部的请求
            const request = this.queue.head()
            if (this.map[request.id] === undefined) {
                this.queue.pop()
                continue
            }
            delete this.map[request.id]
            try {
                this.logger.info(`队列尝试处理请求 ${request.id}`)
                await request.process()
                this.queue.pop()
            } catch (err) {
                this.logger.error(`处理队列请求出错 ${request.id}： `, err)
                this.map[request.id] = null
            }
        }
    }
}
