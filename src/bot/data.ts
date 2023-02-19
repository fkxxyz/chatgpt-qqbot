import {Database} from "../database";

interface FriendIndex {
    id: string, // 对应的ChatGPT 的会话 id
    user_id: number, // 好友QQ号
}

interface FriendMessageIndexLoaded {
    timestamp: number,  // 最后一个已读的QQ消息的时间戳
    message_id: string,  // 最后一个已读的QQ消息的 ID
    mid: string,  // 最后一个 ChatGPT 回复的 mid
}

class FriendData {
    private readonly database: Database;

    constructor(path: string) {
        this.database = new Database(path)
    }

    public load_friend_index(user_id: number): FriendIndex {
        return this.database.get_object<FriendIndex>("index-" + user_id.toString() + ".json")
    }

    public load_friend_message_index_loaded(user_id: number): FriendMessageIndexLoaded {
        return this.database.get_object<FriendMessageIndexLoaded>("current-" + user_id.toString() + ".json")
    }
}