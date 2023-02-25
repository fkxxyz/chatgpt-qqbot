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
    process: () => Promise<any>,
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
}

export class ProcessQueue {
    private readonly queue: Queue<Request>;
    private activate: () => void;

    constructor() {
        this.queue = new Queue<Request>()
        this.activate = () => {
        }
        this.main_loop().then()
    }

    public async process(fn: () => Promise<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.append({
                process: fn,
                resolve: resolve,
                reject: reject,
            })
            this.activate()
        })
    }

    private async main_loop() {
        while (true) {
            if (this.queue.length() == 0) {
                await new Promise(resolve => this.activate = () => resolve(undefined))
            }

            const request = this.queue.pop()
            await request.process()
                .then(value => request.resolve(value))
                .catch(reason => request.reject(reason))
        }
    }
}
