import * as oicq from 'oicq-icalingua-plus-plus';
import {BotThought} from "./thought";
import {BotLogin} from "./login";
import {BotAddFriend} from "./add-friend";
import {BotMessage} from "./message";
import {Database} from "../database";

// Bot 是机器人
/*
需要实现：
- 监听所有所需的 QQ 事件，进行对应的处理
- oicq 断线自动登录
- 暴露自己的数据库接口
*/

export class Bot {
    private readonly client: oicq.Client;
    private readonly master: number;
    private readonly _thought: BotThought;
    private readonly _login: BotLogin;
    private readonly _add_friend: BotAddFriend;
    private readonly _message: BotMessage;

    constructor(client: oicq.Client, database: Database, master: number) {
        this.client = client
        this.master = master
        this._thought = new BotThought(database, this.report_to_master)
        this._login = new BotLogin(client)
        this._add_friend = new BotAddFriend(client, this._thought)
        this._message = new BotMessage(client, this._thought)
    }

    public login(password: string) {
        this._login.login(password)
    }

    public async delete_friend(user_id: number) {
        return this._add_friend.delete_friend(user_id)
    }

    public async get_requests_friend_add() {
        return this._add_friend.get_requests_friend_add()
    }

    public async set_requests_friend_add(flag: string, approve: boolean, remark: string, block: boolean) {
        return this._add_friend.set_requests_friend_add(flag, approve, remark, block)
    }

    private async report_to_master(msg: string) {

    }
}
