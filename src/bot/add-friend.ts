import * as oicq from "oicq-icalingua-plus-plus";

export class BotAddFriend {
    private readonly client: oicq.Client;
    private readonly _io: BotIO;

    constructor(client: oicq.Client, io: BotIO) {
        this.client = client

        io.o.approve_friend_add = this.output_approve_friend_add.bind(this)
        io.o.get_friend_add_requests = this.output_get_friend_add_requests.bind(this)
        io.o.delete_friend = this.delete_friend.bind(this)

        this._io = io

        this.client.on("request.friend.add", this.on_request_friend_add.bind(this))

        this.client.on("notice.friend.increase", this.on_notice_friend_increase.bind(this))
    }

    private async output_get_friend_add_requests() {
        let friends_event_data = await this.get_requests_friend_add()
        let result: Array<AddFriendRequestInfo> = []
        for (let i = 0; i < friends_event_data.length; i++)
            result.push({
                age: friends_event_data[i].age,
                comment: friends_event_data[i].comment,
                nickname: friends_event_data[i].nickname,
                sex: friends_event_data[i].sex,
                source: friends_event_data[i].source,
                user_id: friends_event_data[i].user_id,
            })
        return result
    }

    private async output_approve_friend_add(user_id: number) {
        // 获取到该QQ号对应的系统消息的 flag
        let ret = await this.client.getSystemMsg()
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        let flag = ""
        for (let i = 0; i < ret.data.length; i++) {
            if (ret.data[i].request_type != "friend")
                continue
            if (ret.data[i].sub_type != "add")
                continue

            if (ret.data[i].user_id == user_id) {
                flag = ret.data[i].flag
                break
            }
        }
        if (flag.length == 0) {
            return Promise.reject(`no such friend add request: ${user_id}`)
        }

        return this.set_requests_friend_add(flag, true, "", false)
    }

    // 获取好友申请列表
    private async get_requests_friend_add() {
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

    // 处理好友申请
    private async set_requests_friend_add(flag: string, approve: boolean, remark: string, block: boolean) {
        let ret = await this.client.setFriendAddRequest(flag, approve, remark, block)
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        return ret.data
    }

    // 删除好友
    private async delete_friend(user_id: number) {
        let ret = await this.client.deleteFriend(user_id, false)
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        return ret.data
    }

    // 获取某一条通知的详细信息
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
        this._io.i.receive_friend_add({
            comment: data.comment,
            source: data.source,
            age: data.age,
            nickname: data.nickname,
            sex: data.sex as string,
            user_id: data.user_id
        })
    }

    private on_notice_friend_increase(data: oicq.FriendIncreaseEventData) {
        console.log(`已添加好友： ${data.nickname} (${data.user_id})`)
    }
}