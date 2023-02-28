import * as oicq from 'oicq-icalingua-plus-plus';
import {ConfBot} from 'oicq-icalingua-plus-plus';
import * as log4js from "log4js"
import {Config} from "./config";
import {Bot} from "./bot"
import {Manager} from "./manager";
import {Database} from "./database";
import {Chatgpt} from "./chatgpt";
import {BotAction, BotIO, BotSensor} from "./bot/tought/io";
import {BotLogin} from "./bot/login";
import {BotThought} from "./bot/tought";

// App 是该项目的入口

export class App {
    private config: Config;
    private readonly _oicq_config: ConfBot

    constructor(config: Config) {
        this.config = config
        this._oicq_config = {
            platform: config.oicq.platform,
            data_dir: config.oicq.data,
            ignore_self: false,
            brief: true,
            resend: false,
            reconn_interval: 0,
            auto_server: false,
        }
    }

    public main() {
        const io = {
            i: {
                master: {},
                qq: {},
            } as BotSensor,
            o: {
                qq: {},
                chatgpt: {},
            } as BotAction,
        }
        this.run_chatgpt(io)
        this.run_qq_bot(io)
        this.run_mgr(io)
    }

    public session_only() {
        const client = oicq.createClient(this.config.oicq.account, this._oicq_config)
        const bot_login = new BotLogin(client, null)
        bot_login.login(this.config.oicq.password, true)
    }

    // 该函数启动 chatgpt 服务
    private run_chatgpt(io: BotIO): Chatgpt {
        const chatgpt = new Chatgpt(this.config.app.chatgpt.url)
        const account = chatgpt.account(this.config.app.chatgpt.accounts[0])
        io.o.chatgpt.get = chatgpt.get_message.bind(chatgpt)
        io.o.chatgpt.send = account.send_message.bind(account)
        io.o.chatgpt.new_conv = account.new_conversation.bind(account)
        io.o.chatgpt.title = account.set_title.bind(account)
        io.o.chatgpt.history = account.history.bind(account)
        io.o.chatgpt.is_blocking = account.is_blocking.bind(account)
        io.o.chatgpt.blocking_err = account.blocking_error.bind(account)
        return chatgpt
    }

    // 该函数启动QQ机器人
    private run_qq_bot(io: BotIO): Bot {
        const client = oicq.createClient(this.config.oicq.account, this._oicq_config)
        const database = new Database(this.config.app.database)
        log4js.configure({
            appenders: {
                everything: {
                    type: 'file',
                    filename: this.config.app.log.file,
                },
            },
            categories: {
                default: {appenders: ["everything"], level: this.config.app.log.level},
            },
        })
        const thought = new BotThought(database, this.config.app.masters, io)
        const bot = new Bot(client, thought, io)
        bot.login_with_session()
        return bot
    }

    // 该函数启动后台管理服务
    private run_mgr(io: BotIO): Manager {
        return new Manager(this.config.app.manager.host, this.config.app.manager.port, io.i)
    }
}
