import {Database} from "../../database";

export interface FriendIndex {
    id: string, // 对应的ChatGPT 的会话 id
    user_id: number, // 好友QQ号
    welcome_msg: string, // ChatGPT准备的欢迎语
    welcome_mid: string, // 欢迎语的 mid
}

export interface FriendMessageIndexLoaded {
    message_id: string,  // 最后一个已读的QQ消息的 ID
    mid: string,  // 最后一个 ChatGPT 回复的 mid
}

export class FriendData {
    private readonly database: Database;

    constructor(database: Database) {
        this.database = database
    }

    public load_friend_index(user_id: number): FriendIndex {
        try {
            return this.database.get_object<FriendIndex>("index-" + user_id.toString() + ".json")
        } catch (err) {
            return null
        }
    }

    public load_friend_message_index_loaded(user_id: number): FriendMessageIndexLoaded {
        try {
            return this.database.get_object<FriendMessageIndexLoaded>("current-" + user_id.toString() + ".json")
        } catch (err) {
            return null
        }
    }

    public save_friend_index(user_id: number, friend_index: FriendIndex) {
        this.database.set_object<FriendIndex>("index-" + user_id.toString() + ".json", friend_index)
    }

    public save_friend_message_index_loaded(user_id: number, fmil: FriendMessageIndexLoaded) {
        return this.database.set_object<FriendMessageIndexLoaded>("current-" + user_id.toString() + ".json", fmil)
    }
}