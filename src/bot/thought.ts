import {Database} from "../database";


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
    private readonly master: number;
    private readonly _io: BotIO;
    private request_queue: RequestQueue;

    constructor(database: Database, master: number, io: BotIO) {
        this.database = database
        this.master = master

        io.i.receive_friend_message = this.on_receive_friend_message
        io.i.receive_friend_add = this.on_receive_friend_add
        io.i.master = {
            approve_friend_add: this.on_master_approve_friend_add,
            delete_friend: this.on_master_delete_friend,
            get_friend_add_requests: this.on_master_get_friend_add_requests,
        }

        this._io = io
        this.request_queue = new RequestQueue()
    }

    private on_master_approve_friend_add(user_id: number): Promise<null> {
        return this._io.o.approve_friend_add(user_id)
    }

    private async on_master_delete_friend(user_id: number) {
        return this._io.o.delete_friend(user_id)
    }

    private async on_master_get_friend_add_requests(): Promise<Array<AddFriendRequestInfo>> {
        return this._io.o.get_friend_add_requests()
    }

    private on_receive_friend_message(user_id: number, msg: MessageInfo) {

    }

    private on_receive_friend_add(friend_info: AddFriendRequestInfo) {

    }
}