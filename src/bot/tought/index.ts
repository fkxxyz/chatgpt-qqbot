import * as log4js from "log4js"
import {Database} from "../../database";
import {err_to_text, friend_text, make_chatgpt_msg, new_friend_chatgpt_guide, receive_add_friend_text} from "./text";
import {ReplyMsgInfo} from "../../chatgpt";
import {AddFriendRequestInfo, BotIO, FriendInfo, MessageInfo, OnlineStatus} from "./io";
import {FriendData} from "./data";
import {RequestQueue} from "./queue";


export class BotThought {
    private readonly data: FriendData;
    private readonly masters: Array<number>;
    private readonly _io: BotIO;
    private request_queue: RequestQueue;
    private logger: log4js.Logger;
    private chatgpt_blocking: boolean;

    constructor(database: Database, masters: Array<number>, io: BotIO) {
        this.data = new FriendData(database)
        this.logger = log4js.getLogger("thought");
        this.masters = masters

        setInterval(this.on_timer.bind(this), 1000)

        io.i.qq = {
            online: this.on_online.bind(this),
            offline: this.on_offline.bind(this),
            receive_friend_message: this.on_receive_friend_message.bind(this),
            receive_friend_add: this.on_receive_friend_add.bind(this),
            friend_added: this.on_friend_added.bind(this),
        }
        io.i.master = {
            set_friend_add: this.on_master_set_friend_add.bind(this),
            delete_friend: this.on_master_delete_friend.bind(this),
            get_friend_add_requests: this.on_master_get_friend_add_requests.bind(this),
        }

        this._io = io
        this.request_queue = new RequestQueue()

        this.chatgpt_blocking = false
    }

    private on_timer() {
        const is_blocking = this._io.o.chatgpt.is_blocking()
        if (is_blocking != this.chatgpt_blocking) {
            if (is_blocking) {
                this.log_promise("设置在线状态", "忙碌",
                    this._io.o.qq.set_online_status(OnlineStatus.busy)
                ).then()
                this.send_to_master("我已进入忙碌")
            } else {
                this.log_promise("设置在线状态", "在线",
                    this._io.o.qq.set_online_status(OnlineStatus.online)
                ).then()
                this.send_to_master("我已恢复空闲")
            }
            this.chatgpt_blocking = is_blocking
        }
    }

    private on_online() {
        this.logger.info("QQ 上线")
        this.log_promise("设置在线状态", "在线",
            this._io.o.qq.set_online_status(OnlineStatus.online)).then()

        const all_friends = this._io.o.qq.get_all_friends()
        for (let i = 0; i < all_friends.length; i++) {
            const user_id = all_friends[i].user_id
            if (!this.request_queue.has(user_id))
                this.request_queue.append({
                    id: user_id,
                    process: () => {
                        return this.reply_friend_message(user_id)
                    }
                })
        }
    }

    private on_offline() {
        this.logger.info("QQ 掉线")
    }

    private async on_master_set_friend_add(user_id: number, approve: boolean): Promise<any> {
        if (!approve) {
            return this.log_promise("拒绝好友请求", `${user_id}`,
                this._io.o.qq.set_friend_add(user_id, false))
        }

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

        this.logger.info(`收到主人通过好友请求 ${friend.nickname} (${friend.user_id})`)
        if (!this.request_queue.has(user_id)) {
            this.request_queue.append({
                id: user_id,
                process: async () => {
                    this.logger.info("请求 ChatGPT 生成欢迎语", friend_text(friend))
                    // 发送引导语给 ChatGPT 得到欢迎语
                    const self_info = this._io.o.qq.get_self()
                    const msg = new_friend_chatgpt_guide(self_info, friend)
                    let mid: string
                    try {
                        mid = await this._io.o.chatgpt.new_conv(msg)
                    } catch (err) {
                        this.send_to_master(`发送 ${friend_text(friend)} 的欢迎语请求给 ChatGPT 出错： ` + err)
                        return
                    }
                    let msg_info: ReplyMsgInfo
                    while (true) {
                        msg_info = await this._io.o.chatgpt.get(mid)
                        if (msg_info.end)
                            break
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                    this.logger.info("得到欢迎语", friend_text(friend))
                    this.logger.info(`生成 ChatGPT 对话 id QQ-${friend.user_id}`)
                    await this._io.o.chatgpt.title(msg_info.id, `QQ-${friend.user_id}`)
                    this.data.save_friend_index(user_id, {
                        user_id: user_id,
                        id: msg_info.id,
                        welcome_mid: msg_info.mid,
                        welcome_msg: msg_info.msg,
                    })
                    return this.log_promise("同意好友请求", friend_text(friend),
                        this._io.o.qq.set_friend_add(user_id, true))
                },
            })
        }
        return null
    }


    private async on_master_delete_friend(user_id: number) {
        const friend = this._io.o.qq.get_friend(user_id)
        return this.log_promise("删除好友", friend_text(friend),
            this._io.o.qq.delete_friend(user_id))
    }

    private async on_master_get_friend_add_requests(): Promise<Array<AddFriendRequestInfo>> {
        return this.log_promise("获取请求列表", "",
            this._io.o.qq.get_friend_add_requests())
    }

    private on_receive_friend_message(user_id: number, msg: MessageInfo) {
        // 收到好友消息，加到队列处理
        if (!this.request_queue.has(user_id)) {
            this.request_queue.append({
                id: user_id,
                process: async () => {
                    return this.reply_friend_message(user_id)
                }
            })
        }
    }

    private on_receive_friend_add(friend_info: AddFriendRequestInfo) {
        // 收到好友请求，发送给主人
        this.send_to_master(receive_add_friend_text(friend_info))

        // 直接通过好友请求
        this.on_master_set_friend_add(friend_info.user_id, true).then()
    }

    private on_friend_added(friend: FriendInfo) {
        // 好友添加成功
        const friend_index = this.data.load_friend_index(friend.user_id)
        if (friend_index === null) {
            this.send_to_master("添加好友却没准备好消息： " + friend.user_id)
        }
        this.log_promise("发送欢迎语", friend_text(friend),
            this._io.o.qq.send_friend_message(friend.user_id, {
                content: friend_index.welcome_msg,
            }).then(message_id => {
                this.data.save_friend_message_index_loaded(friend.user_id, {
                    message_id: message_id,
                    mid: friend_index.welcome_mid,
                })
            }))
    }

    private async get_last_chatgpt_mid(id: string): Promise<string> {
        const conv = await this._io.o.chatgpt.history(id)
        const current = conv.mapping[conv.current_node]
        if (current === undefined) {
            return ""
        }
        if (current.message.author.role == "user")
            return current.parent
        else
            return current.id
    }

    private async reply_friend_message(user_id: number) {
        const friend = this._io.o.qq.get_friend(user_id)
        this.logger.info("检查好友消息 " + friend_text(friend))
        const friend_index = this.data.load_friend_index(user_id)
        if (friend_index === null)
            return
        const fmil = this.data.load_friend_message_index_loaded(user_id)
        if (fmil === null)
            return

        // 获取所有未读消息
        const history = await this._io.o.qq.get_history(user_id, fmil.message_id)
        if (history.length == 0)
            return
        this.logger.info(`好友有未读消息 ${history.length} 条 ` + friend_text(friend))
        const last_message_id = history[history.length - 1].id

        // 将消息封装成一条
        const chatgpt_msg = make_chatgpt_msg(history)

        // 一次性发送给 ChatGPT 得到回复
        this.logger.info("请求 ChatGPT 生成回复 " + friend_text(friend))
        let mid: string
        try {
            mid = await this._io.o.chatgpt.send(chatgpt_msg, friend_index.id, fmil.mid)
        } catch (err) {
            if (err.response !== undefined) {
                if (err.response.status == 406) {
                    this.logger.info("请求出错406，重新加载会话 " + friend_text(friend))
                    const fix_mid = await this.get_last_chatgpt_mid(friend_index.id)
                    this.data.save_friend_message_index_loaded(user_id, {
                        message_id: fmil.message_id,
                        mid: fix_mid,
                    })
                    throw "reset conversation"
                }
            }
            this.send_to_master(`发送 ${friend_text(friend)} 的消息给 ChatGPT 出错： ` + err)
            return
        }
        let msg_info: ReplyMsgInfo
        while (true) {
            msg_info = await this._io.o.chatgpt.get(mid)
            if (msg_info.end)
                break
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        this.logger.info("得到回复 " + friend_text(friend))

        // 将回复发送给好友
        return this.log_promise("回复好友", friend_text(friend),
            this._io.o.qq.send_friend_message(user_id, {
                content: msg_info.msg,
            }).then(message_id => {
                this.data.save_friend_message_index_loaded(user_id, {
                    message_id: last_message_id,
                    mid: msg_info.mid,
                })
            })
        )
    }

    private send_to_master(msg: string) {
        for (let i = 0; i < this.masters.length; i++) {
            this._io.o.qq.send_friend_message(this.masters[i], {
                content: msg,
            }).then().catch(err => {
                this.logger.error(err)
            })
        }
    }

    private log_promise(action: string, content: string, p: Promise<any>): Promise<any> {
        this.logger.info(`开始 ${action} ${content}`)
        return p.then(data => {
            this.logger.info(`${action} 成功 ${content}`)
            return data
        }).catch(err => {
            const err_msg = `${action} 失败 ${content}： ` + err_to_text(err)
            this.logger.error(err_msg)
            this.send_to_master(err_msg)
        })
    }
}
