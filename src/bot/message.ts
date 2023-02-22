import * as oicq from "oicq-icalingua-plus-plus";
import {BotIO, MessageContent, MessageInfo} from "./tought/io";

const {getC2CMsgs} = require("oicq-icalingua-plus-plus/lib/message/history");
const {parseC2CMsg} = require("oicq-icalingua-plus-plus/lib/message/parser");
const {parseC2CMessageId} = require("oicq-icalingua-plus-plus/lib/common");

interface MessageIdInfo {
    user_id: number,
    seq: number,
    random: number,
    time: number,
    flag: number,
}

function IdLessThen(id1: MessageIdInfo, id2: MessageIdInfo): boolean {
    return id1.time == id2.time ? id1.seq < id2.seq : id1.time < id2.time
}

function IdLessEqualThen(id1: MessageIdInfo, id2: MessageIdInfo): boolean {
    return id1.time == id2.time ? id1.seq <= id2.seq : id1.time <= id2.time
}

function IdSub(id1: MessageIdInfo, id2: MessageIdInfo): number {
    return id1.time == id2.time ? id1.seq - id2.seq : id1.time - id2.time
}

function parseC2CMessageIdInfo(message_id: string): MessageIdInfo {
    return parseC2CMessageId(message_id) as MessageIdInfo
}

interface PrivateMessageEventDataSeq extends oicq.PrivateMessageEventData {
    id_info: MessageIdInfo,
}

const big_time = 1000000000000;
const big_seq = 1000000000000;

export class BotMessage {
    private readonly client: oicq.Client;
    private readonly _io: BotIO;
    private unread_messages: { [key: number]: Array<PrivateMessageEventDataSeq> };

    constructor(client: oicq.Client, io: BotIO) {
        this.client = client
        io.o.qq.send_friend_message = this.output_send_friend_message.bind(this)
        io.o.qq.get_history = this.output_get_history.bind(this)
        this._io = io
        this.unread_messages = {}

        this.client.on("message.private.friend", this.on_message_private_friend.bind(this))
    }

    private async output_send_friend_message(user_id: number, msg: MessageContent) {
        let ret = await this.send_friend_message(user_id, msg.content, false)
        return ret.message_id
    }

    private async output_get_history(user_id: number, message_id: string) {
        let unread_msgs = await this.get_c2c_unread_messages(user_id, message_id)
        let result: Array<MessageInfo> = []
        for (let i = 0; i < unread_msgs.length; i++)
            result.push({
                id: unread_msgs[i].message_id,
                time: unread_msgs[i].time,
                content: {
                    content: unread_msgs[i].raw_message,
                },
            })
        return result
    }

    private async send_friend_message(user_id: number, msg: string, auto_escape: boolean = false) {
        let ret = await this.client.sendPrivateMsg(user_id, msg, auto_escape);
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        return ret.data
    }

    private on_message_private_friend(data: oicq.PrivateMessageEventData) {
        let data_ = data as PrivateMessageEventDataSeq
        data_.id_info = parseC2CMessageIdInfo(data.message_id)
        if (this.unread_messages[data.user_id] === undefined)
            this.unread_messages[data.user_id] = []
        this.unread_messages[data.user_id].push(data_)
        this._io.i.qq.receive_friend_message(data.user_id, {
            id: data.message_id,
            time: data.time,
            content: {
                content: data.raw_message,
            },
        })
    }

    private async get_c2c_messages(user_id: number, time: number, count: number = 20): Promise<Array<oicq.PrivateMessageEventData>> {
        const msgs = await getC2CMsgs.call(this.client, user_id, time, count).catch(err => {
            return []
        })
        let result = []
        for (let i = 0; i < msgs.length; i++) {
            result.push(await parseC2CMsg.call(this.client, msgs[i]))
        }
        return result
    }

    // message_id 表示已读的最后的消息
    //   获取的结果确保是有序的
    private async get_c2c_unread_messages(user_id: number, message_id: string): Promise<Array<oicq.PrivateMessageEventData>> {
        const target_msg_info = parseC2CMessageIdInfo(message_id)

        // 优先从内存里找未读消息
        if (user_id in this.unread_messages) {
            const unread_messages = this.unread_messages[user_id]
            unread_messages.sort((m1, m2) =>
                IdSub(m1.id_info, m2.id_info) // 按序号排序
            )
            if (unread_messages.length > 0 && IdLessThen(unread_messages[0].id_info, target_msg_info)) { // 确保内存中的记录能完全覆盖到
                for (let i = 0; i < unread_messages.length; i++) {
                    const msg = unread_messages[i]
                    if (msg.message_id == message_id) {
                        const result = this.unread_messages[user_id].slice(i + 1)
                        this.unread_messages[user_id] = this.unread_messages[user_id].slice(i)
                        return result
                    }
                }
            }
        }

        // 需要获取消息历史中来获取到未读消息

        // 确保获取到足够多的冗余的历史记录
        let current_time = big_time
        const history: Array<Array<PrivateMessageEventDataSeq>> = []
        while (current_time >= target_msg_info.time) {
            const msgs = await this.get_c2c_messages(user_id, current_time, 20)
            history.push(msgs as Array<PrivateMessageEventDataSeq>)
            if (msgs.length < 20)
                break
            if (current_time == msgs[0].time)
                current_time = msgs[0].time - 1
            else
                current_time = msgs[0].time
        }

        // 去重合并
        let history_: Array<PrivateMessageEventDataSeq> = []
        let i
        for (i = history.length - 1; i >= 0; i--)
            if (history[i].length != 0)
                break
        if (i >= 0) {
            history_.push(...history[i])
            let time_remove = history[i][history[0].length - 1].time
            i--
            for (; i >= 0; i--) {
                let j
                for (j = 0; j < history[i].length; j++)
                    if (history[i][j].time > time_remove)
                        break
                history_.push(...history[i].slice(j))
                time_remove = history[i][history[i].length - 1].time
            }
        }

        // 排序
        for (let i = 0; i < history_.length; i++) {
            history_[i].id_info = parseC2CMessageIdInfo(history_[i].message_id)
        }
        history_.sort((m1, m2) =>
            IdSub(m1.id_info, m2.id_info) // 按序号排序
        )

        // 去掉无效的
        let result: Array<oicq.PrivateMessageEventData> = []
        for (let i = 0; i < history_.length; i++) {
            const msg = history_[i]
            if (IdLessEqualThen(msg.id_info, target_msg_info))
                continue
            if (msg.user_id != user_id)
                continue
            result.push(msg)
        }
        return result
    }
}