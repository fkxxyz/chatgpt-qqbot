import {ReplyMsgInfo} from "../../chatgpt";

export interface SelfInfo {
    user_id: number,
    nickname: string,
    age: number,
}

export interface FriendInfo {
    user_id: number,
    nickname: string,
    age: number,
    sex: string,
}

export interface AddFriendRequestInfo extends FriendInfo {
    comment: string, // 附加信息
    source: string, // 来源(如"条件查找")
}

export interface MessageInfo {
    time: number
    id: string
    content: MessageContent
}

export interface MessageContent {
    content: string
}

export interface BotAction {
    qq: {
        approve_friend_add(user_id: number): Promise<null>
        send_friend_message(user_id: number, msg: MessageContent): Promise<string>
        get_self(): SelfInfo
        get_history(user_id: number, message_id: string): Promise<Array<MessageInfo>>
        get_friend_add_requests(): Promise<Array<AddFriendRequestInfo>>
        delete_friend(user_id: number): Promise<null>
    }
    chatgpt: {
        title(id: string, title: string): Promise<any>
        send(msg: string, id: string, mid: string): Promise<string>
        new_conv(msg: string): Promise<string>
        get(mid: string): Promise<ReplyMsgInfo>
    }
}


export interface BotSensor {
    master: {
        approve_friend_add(user_id: number): Promise<any>
        delete_friend(user_id: number): Promise<null>
        get_friend_add_requests(): Promise<Array<AddFriendRequestInfo>>
    }

    receive_friend_message(user_id: number, msg: MessageInfo)

    receive_friend_add(friend_info: AddFriendRequestInfo)

    friend_added(friend_info: FriendInfo)
}

export interface BotIO {
    i: BotSensor,
    o: BotAction,
}