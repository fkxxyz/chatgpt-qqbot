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
}

interface AddFriendRequestInfo extends FriendInfo {
    comment: string, // 附加信息
    source: string, // 来源(如"条件查找")
}

interface MessageInfo {
    time: number
    id: string
    content: MessageContent
}

interface MessageContent {
    content: string
}

interface BotAction {
    approve_friend_add(user_id: number): Promise<null>

    send_friend_message(user_id: number, msg: MessageContent): Promise<string>

    get_self(): SelfInfo

    get_history(user_id: number, message_id: string): Promise<Array<MessageInfo>>

    get_friend_add_requests(): Promise<Array<AddFriendRequestInfo>>

    delete_friend(user_id: number): Promise<null>
}

interface BotSensorFromMaster {
    approve_friend_add(user_id: number): Promise<null>

    delete_friend(user_id: number): Promise<null>

    get_friend_add_requests(): Promise<Array<AddFriendRequestInfo>>
}

interface BotSensor {
    master: BotSensorFromMaster

    receive_friend_message(user_id: number, msg: MessageInfo)

    receive_friend_add(friend_info: AddFriendRequestInfo)
}

interface BotIO {
    i: BotSensor,
    o: BotAction,
}