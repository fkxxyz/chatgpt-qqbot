import * as oicq from 'oicq-icalingua-plus-plus';
import {BotThought} from "./tought";
import {BotLogin} from "./login";
import {BotAddFriend} from "./add-friend";
import {BotMessage} from "./message";
import {BotIO, OnlineStatus} from "./tought/io";

// Bot 是机器人
/*
需要实现：
- 监听所有所需的 QQ 事件，进行对应的处理
- oicq 断线自动登录
- 暴露自己的数据库接口
*/

export class Bot {
    private readonly client: oicq.Client;
    private readonly _thought: BotThought;
    private readonly _login: BotLogin;
    private readonly _add_friend: BotAddFriend;
    private readonly _message: BotMessage;

    constructor(client: oicq.Client, thought: BotThought, io: BotIO) {
        this.client = client
        io.o.qq.get_self = () => {
            return {
                user_id: this.client.uin,
                nickname: this.client.nickname,
                age: this.client.age,
            }
        }
        io.o.qq.get_friend = (user_id) => {
            const info = this.client.fl.get(user_id)
            return {
                user_id: info.user_id,
                nickname: info.nickname,
                age: info.age,
                sex: info.sex as string,
            }
        }
        io.o.qq.get_all_friends = () => {
            const result = []
            for (const friend of this.client.fl.values())
                result.push({
                    user_id: friend.user_id,
                    nickname: friend.nickname,
                    age: friend.age,
                    sex: friend.sex,
                })
            return result
        }
        io.o.qq.set_online_status = (status) => {
            let online_status: number
            switch (status) {
                case OnlineStatus.online:
                    online_status = 60
                    break
                case OnlineStatus.busy:
                    online_status = 50
                    break
                case OnlineStatus.leave:
                    online_status = 31
                    break
            }
            return this.client.setOnlineStatus(online_status)
        }
        this._thought = thought
        this._login = new BotLogin(client, io)
        this._add_friend = new BotAddFriend(client, io)
        this._message = new BotMessage(client, io)
    }

    public login(password: string) {
        this._login.login(password)
    }

    public login_with_session() {
        this._login.login_with_session()
    }
}
