import * as oicq from 'oicq-icalingua-plus-plus';
import {BotThought} from "./tought";
import {BotLogin} from "./login";
import {BotAddFriend} from "./add-friend";
import {BotMessage} from "./message";
import {Database} from "../database";
import {BotIO} from "./tought/io";

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

    constructor(client: oicq.Client, io: BotIO, database: Database, master: number) {
        this.client = client
        io.o.qq.get_self = () => {
            return {
                user_id: this.client.uin,
                nickname: this.client.nickname,
                age: this.client.age,
            }
        }
        this._thought = new BotThought(database, master, io)
        this._login = new BotLogin(client)
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
