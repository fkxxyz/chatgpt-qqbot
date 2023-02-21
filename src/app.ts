import * as oicq from 'oicq-icalingua-plus-plus';
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

    constructor(config: Config) {
        this.config = config
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
        const client = oicq.createClient(this.config.oicq.account, {
            platform: 4,
            data_dir: this.config.oicq.data,
            ignore_self: false,
            brief: true,
        })
        const bot_login = new BotLogin(client, null)
        bot_login.login(this.config.oicq.password, true)
    }

    // 该函数启动 chatgpt 服务
    private run_chatgpt(io: BotIO): Chatgpt {
        const chatgpt = new Chatgpt(this.config.app.chatgpt)
        io.o.chatgpt.get = chatgpt.get_message.bind(chatgpt)
        io.o.chatgpt.send = chatgpt.send_message.bind(chatgpt)
        io.o.chatgpt.new_conv = chatgpt.new_conversation.bind(chatgpt)
        io.o.chatgpt.title = chatgpt.set_title.bind(chatgpt)
        io.o.chatgpt.is_blocking = chatgpt.is_blocking.bind(chatgpt)
        return chatgpt
    }

    // 该函数启动QQ机器人
    private run_qq_bot(io: BotIO): Bot {
        const client = oicq.createClient(this.config.oicq.account, {
            platform: 4,
            data_dir: this.config.oicq.data,
            ignore_self: false,
            brief: true,
        })
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
        const thought = new BotThought(database, this.config.app.master, io)
        const bot = new Bot(client, thought, io)
        bot.login_with_session()
        return bot
    }

    // 该函数启动后台管理服务
    private run_mgr(io: BotIO): Manager {
        return new Manager(this.config.app.manager.host, this.config.app.manager.port, io.i)
    }
}
