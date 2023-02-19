import * as oicq from "oicq-icalingua-plus-plus";
import {BotThought} from "./thought";

export class BotAddFriend {
    private readonly client: oicq.Client;
    private readonly _thought: BotThought;

    constructor(client: oicq.Client, thought: BotThought) {
        this.client = client
        this._thought = thought

        this.client.on("request.friend.add", this.on_request_friend_add)

        this.client.on("notice.friend.increase", this.on_notice_friend_increase)
    }

    public async delete_friend(user_id: number) {
        let ret = await this.client.deleteFriend(user_id, false)
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        return ret.data
    }

    public async get_requests_friend_add() {
        let ret = await this.client.getSystemMsg()
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        let requests: Array<oicq.FriendAddEventData> = []
        for (let i = 0; i < ret.data.length; i++) {
            if (ret.data[i].request_type != "friend")
                continue
            if (ret.data[i].sub_type != "add")
                continue

            requests.push(ret.data[i] as oicq.FriendAddEventData)
        }
        return requests
    }

    public async set_requests_friend_add(flag: string, approve: boolean, remark: string, block: boolean) {
        if (approve) {
            let data = await this.get_request_event_data(flag)
            if (data.request_type != "friend")
                return Promise.reject("not a friend add request")
            await this._thought.before_add_friend({
                user_id: this.client.uin,
                nickname: this.client.nickname,
                age: this.client.age,
            }, {
                user_id: data.user_id,
                nickname: data.nickname,
                age: data.age,
                sex: data.sex as string,
                comment: data.comment,
                source: data.source,
            })
        }
        let ret = await this.client.setFriendAddRequest(flag, approve, remark, block)
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        return ret.data
    }

    private async get_request_event_data(flag: string) {
        let ret = await this.client.getSystemMsg()
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        for (let i = 0; i < ret.data.length; i++) {
            if (ret.data[i].flag == flag) {
                return ret.data[i]
            }
        }
    }

    private on_request_friend_add(data: oicq.FriendAddEventData) {
        console.log(`收到好友请求： ${data.nickname} (${data.user_id})`)
    }

    private on_notice_friend_increase(data: oicq.FriendIncreaseEventData) {
        console.log(`已添加好友： ${data.nickname} (${data.user_id})`)
    }
}