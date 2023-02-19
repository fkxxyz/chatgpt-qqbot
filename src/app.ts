import * as oicq from 'oicq-icalingua-plus-plus';
import {Config} from "./config";
import {Bot} from "./bot"
import {Manager} from "./manager";
import {Database} from "./database";

// App 是该项目的入口

export class App {
    private config: Config;

    constructor(config: Config) {
        this.config = config
    }

    public main() {
        const io = {
            i: {} as BotSensor,
            o: {} as BotAction,
        }
        this.run_qq_bot(io)
        this.run_mgr(io)
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
        const bot = new Bot(client, io, database, this.config.app.master)
        bot.login_with_session()
        // bot.login(this.config.oicq.password)
        return bot
    }

    // 该函数启动后台管理服务
    private run_mgr(io: BotIO): Manager {
        return new Manager(this.config.app.manager.host, this.config.app.manager.port, io.i)
    }
}
