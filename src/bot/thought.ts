import {Database} from "../database";

interface SelfInfo {
    user_id: number,
    nickname: string,
    age: number,
}

interface FriendInfo {
    user_id: number,
    nickname: string,
    age: number,
    sex: string,
    comment: string, //附加信息
    source: string, //来源(如"条件查找")
}

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

enum RequestType {
    message_received,
    friend_add,
}

interface RequestMessageReceived {
    request_type: RequestType.message_received;
    user_id: number;
}

interface RequestFriendAdd {
    request_type: RequestType.friend_add;
}

type Request = RequestMessageReceived | RequestFriendAdd

class RequestQueue {
    private readonly queue: Queue<Request>;
    private activate: Function;

    constructor() {
        this.queue = new Queue<Request>()
        this.main_loop().then()
    }

    public append(request: Request) {
        this.queue.append(request)
    }

    private async main_loop() {
        while (true) {
            if (this.queue.length() == 0) {
                await new Promise((resolve, rejects) => {
                    this.activate = resolve
                })
            }

            // 开始处理最头部的请求
            const request = this.queue.head()
            switch (request.request_type) {
                case RequestType.friend_add:
                    break
                case RequestType.message_received:
                    break
            }
        }
    }
}

export class BotThought {
    private readonly database: Database;
    private readonly report_fn: (msg: string) => Promise<void>;
    private request_queue: RequestQueue;

    constructor(database: Database, report_fn: (msg: string) => Promise<void>) {
        this.database = database
        this.report_fn = report_fn
        this.request_queue = new RequestQueue()
    }

    public before_add_friend(self_info: SelfInfo, friend_info: FriendInfo) {

    }

    public message_received() {

    }
}