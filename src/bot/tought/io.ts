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

export enum OnlineStatus {
    online,
    busy,
    leave,
}

export interface ChatgptHistory {
    current_node: string
    mapping: {
        [id: string]: {
            id: string
            parent: string
            message: {
                author: {
                    role: string
                }
                content: {
                    parts: Array<string>
                }
            }
        }
    }
}

export interface BotAction {
    qq: {
        set_online_status: (status: OnlineStatus) => Promise<any>;
        set_friend_add: (user_id: number, approve: boolean) => Promise<any>
        send_friend_message: (user_id: number, msg: MessageContent) => Promise<string>
        get_self: () => SelfInfo
        get_friend: (user_id: number) => FriendInfo
        get_all_friends: () => Array<FriendInfo>
        get_history: (user_id: number, message_id: string) => Promise<Array<MessageInfo>>
        get_friend_add_requests: () => Promise<Array<AddFriendRequestInfo>>
        delete_friend: (user_id: number) => Promise<any>
    }
    chatgpt: {
        title: (id: string, title: string) => Promise<any>
        send: (msg: string, id: string, mid: string) => Promise<string>
        history: (id: string) => Promise<ChatgptHistory>
        new_conv: (msg: string) => Promise<string>
        get: (mid: string) => Promise<ReplyMsgInfo>
        is_blocking: () => boolean
    }
}


export interface BotSensor {
    master: {
        set_friend_add: (user_id: number, approve: boolean) => Promise<any>
        delete_friend: (user_id: number) => Promise<any>
        get_friend_add_requests: () => Promise<Array<AddFriendRequestInfo>>
    }
    qq: {
        online: () => any
        offline: () => any
        receive_friend_message: (user_id: number, msg: MessageInfo) => any
        receive_friend_add: (friend_info: AddFriendRequestInfo) => any
        friend_added: (friend_info: FriendInfo) => any
    }
}

export interface BotIO {
    i: BotSensor,
    o: BotAction,
}