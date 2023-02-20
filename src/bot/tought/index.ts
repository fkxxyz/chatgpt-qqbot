import {Database} from "../../database";
import {err_to_text, make_chatgpt_msg, new_friend_chatgpt_guide, receive_add_friend_text} from "./text";
import {ReplyMsgInfo} from "../../chatgpt";
import {AddFriendRequestInfo, BotIO, FriendInfo, MessageInfo} from "./io";
import {FriendData} from "./data";


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

class RequestQueue {
    private readonly queue: Queue<Request>;
    private activate: Function;
    private map: { [key: number]: null };

    constructor() {
        this.queue = new Queue<Request>()
        this.activate = () => {
        }
        this.map = {}
        this.main_loop().then()
    }

    public append(request: Request) {
        this.queue.append(request)
        this.map[request.id] = null
        this.activate()
    }

    public has(id: number) {
        return this.map[id] !== undefined
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
            try {
                await request.process()
                this.queue.pop()
                delete this.map[request.id]
            } catch (err) {
                console.log("处理队列消息出错： ", request.id, err)
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

export class BotThought {
    private readonly data: FriendData;
    private readonly master: number;
    private readonly _io: BotIO;
    private request_queue: RequestQueue;

    constructor(database: Database, master: number, io: BotIO) {
        this.data = new FriendData(database)
        this.master = master

        io.i.receive_friend_message = this.on_receive_friend_message.bind(this)
        io.i.receive_friend_add = this.on_receive_friend_add.bind(this)
        io.i.friend_added = this.on_friend_added.bind(this)
        io.i.master = {
            approve_friend_add: this.on_master_approve_friend_add.bind(this),
            delete_friend: this.on_master_delete_friend.bind(this),
            get_friend_add_requests: this.on_master_get_friend_add_requests.bind(this),
        }

        this._io = io
        this.request_queue = new RequestQueue()
    }

    private async on_master_approve_friend_add(user_id: number): Promise<any> {
        // 主人要求通过申请，加到请求队列
        let requests = await this._io.o.qq.get_friend_add_requests()
        let friend: AddFriendRequestInfo = null
        for (let i = 0; i < requests.length; i++) {
            if (requests[i].user_id == user_id) {
                friend = requests[i]
                break
            }
        }
        if (friend === null)
            return Promise.reject({message: "nu such add friend request: " + user_id})

        if (!this.request_queue.has(user_id)) {
            this.request_queue.append({
                id: user_id,
                process: async () => {
                    // 发送引导语给 ChatGPT 得到欢迎语
                    const self_info = this._io.o.qq.get_self()
                    const msg = new_friend_chatgpt_guide(self_info, friend)
                    const mid = await this._io.o.chatgpt.new_conv(msg)
                    let msg_info: ReplyMsgInfo
                    while (true) {
                        msg_info = await this._io.o.chatgpt.get(mid)
                        if (msg_info.end)
                            break
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                    await this._io.o.chatgpt.title(msg_info.id, `QQ-${friend.user_id}`)
                    this.data.save_friend_index(user_id, {
                        user_id: user_id,
                        id: msg_info.id,
                        welcome_mid: msg_info.mid,
                        welcome_msg: msg_info.msg,
                    })
                    this._io.o.qq.approve_friend_add(user_id).catch(err => {
                        this.send_to_master("同意好友请求失败： " + err_to_text(err))
                    })
                },
            })
        }
        return null
    }

    private async on_master_delete_friend(user_id: number) {
        return this._io.o.qq.delete_friend(user_id)
    }

    private async on_master_get_friend_add_requests(): Promise<Array<AddFriendRequestInfo>> {
        return this._io.o.qq.get_friend_add_requests()
    }

    private on_receive_friend_message(user_id: number, msg: MessageInfo) {
        // 收到好友消息，加到队列处理
        if (!this.request_queue.has(user_id)) {
            this.request_queue.append({
                id: user_id,
                process: async () => {
                    const friend_index = this.data.load_friend_index(user_id)
                    if (friend_index === null)
                        return
                    const fmil = this.data.load_friend_message_index_loaded(user_id)
                    if (fmil === null)
                        return

                    // 获取所有未读消息
                    const history = await this._io.o.qq.get_history(user_id, fmil.message_id)

                    // 刚发的消息，在历史里面可能没有
                    if (history.length == 0 || history[history.length - 1].id != msg.id)
                        history.push(msg)
                    const last_message_id = history[history.length - 1].id

                    // 将消息封装成一条
                    const chatgpt_msg = make_chatgpt_msg(history)

                    // 一次性发送给 ChatGPT 得到回复
                    const mid = await this._io.o.chatgpt.send(chatgpt_msg, friend_index.id, fmil.mid)
                    let msg_info: ReplyMsgInfo
                    while (true) {
                        msg_info = await this._io.o.chatgpt.get(mid)
                        if (msg_info.end)
                            break
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }

                    // 将回复发送给好友
                    this._io.o.qq.send_friend_message(user_id, {
                        content: msg_info.msg,
                    }).then(message_id => {
                        this.data.save_friend_message_index_loaded(user_id, {
                            message_id: last_message_id,
                            mid: msg_info.mid,
                        })
                    }).catch(err => {
                        this.send_to_master(`发送消息给 ${user_id} 失败： ${err_to_text(err)}`)
                    })
                },
            })
        }
    }

    private on_receive_friend_add(friend_info: AddFriendRequestInfo) {
        // 收到好友请求，发送给主人
        this.send_to_master(receive_add_friend_text(friend_info))
    }

    private on_friend_added(friend_info: FriendInfo) {
        // 好友添加成功
        const friend_index = this.data.load_friend_index(friend_info.user_id)
        if (friend_index === null) {
            this.send_to_master("添加好友却没准备好消息： " + friend_info.user_id)
        }
        this._io.o.qq.send_friend_message(friend_info.user_id, {
            content: friend_index.welcome_msg,
        }).then(message_id => {
            this.data.save_friend_message_index_loaded(friend_info.user_id, {
                message_id: message_id,
                mid: friend_index.welcome_mid,
            })
        }).catch(err => {
            this.send_to_master(`发送消息给 ${friend_info.user_id} 失败： ${err_to_text(err)}`)
        })
    }

    private send_to_master(msg: string) {
        this._io.o.qq.send_friend_message(this.master, {
            content: msg,
        }).then().catch(err => {
            console.error(err)
        })
    }
}