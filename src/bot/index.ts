import * as oicq from 'oicq-icalingua-plus-plus';

// Bot 是机器人
/*
需要实现：
- 监听所有所需的 QQ 事件，进行对应的处理
- oicq 断线自动登录
- 暴露自己的数据库接口
*/

export class Bot {
    private client: oicq.Client;

    constructor(client: oicq.Client) {
        this.client = client

        this.client.on("system.login.slider", this.on_system_login_slider)
        this.client.on("system.login.device", this.on_system_login_device)
        this.client.on("system.login.qrcode", this.on_system_login_qrcode)
        this.client.on("system.login.error", this.on_system_login_error)

        this.client.on("system.online", this.on_system_online)
        this.client.on("system.offline.network", this.on_system_offline_network)
        this.client.on("system.offline.kickoff", this.on_system_offline_kickoff)
        this.client.on("system.offline.frozen", this.on_system_offline_frozen)
        this.client.on("system.offline.unknown", this.on_system_offline_unknown)

        this.client.on("request.friend.add", this.on_request_friend_add)

        this.client.on("notice.friend.increase", this.on_notice_friend_increase)

        this.client.on("message.private.friend", this.message_private_friend)
    }

    public login(password: string) {
        this.client.login(password)
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
        let ret = await this.client.setFriendAddRequest(flag, approve, remark, block)
        if (ret.retcode != 0) {
            if (ret.retcode == 1) {
                return Promise.reject(ret.status)
            }
            return Promise.reject(ret.error)
        }
        return ret.data
    }

    private on_system_login_slider(data: oicq.SliderEventData) {
        console.log("需要滑动验证码")
        this.client.terminate()
    }

    private on_system_login_device(data: oicq.DeviceEventData) {
        console.log("需要锁验证")
        this.client.terminate()
    }

    private on_system_login_qrcode(data: oicq.QrcodeEventData) {
        console.log("需要二维码验证")
        this.client.terminate()
    }

    private on_system_login_error(data: oicq.LoginErrorEventData) {
        console.log(`登录错误 ${data.code} ： ${data.message}`)
        this.client.terminate()
    }


    private on_system_online(data: oicq.OnlineEventData) {
        console.log(`上线`)
    }

    private on_system_offline_network(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
    }

    private on_system_offline_kickoff(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
    }

    private on_system_offline_frozen(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
    }

    private on_system_offline_unknown(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
    }

    private message_private_friend(data: oicq.PrivateMessageEventData) {
        console.log(`消息：`)
        console.log(data)
        data.reply("hello", true).then(data => {
            if (data.error != null) {
                console.log(`发送消息出错 ${data.error.code} ： ${data.error.message}`)
                return
            }
            if (data.retcode == 0) {
                console.log(`回复成功`)
                return
            }
        }).catch(err => {
            console.log(`发送消息失败`)
            console.log(err)
        })
    }

    private on_request_friend_add(data: oicq.FriendAddEventData) {
        console.log(`收到好友请求： ${data.nickname} (${data.user_id})`)
    }

    private on_notice_friend_increase(data: oicq.FriendIncreaseEventData) {
        console.log(`已添加好友： ${data.nickname} (${data.user_id})`)
    }
}
