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
        const bot = this.run_qq_bot()
        this.run_mgr(bot)
    }

    // 该函数启动QQ机器人
    private run_qq_bot(): Bot {
        const client = oicq.createClient(this.config.oicq.account, {
            platform: 4,
            data_dir: this.config.oicq.data,
            ignore_self: false,
            brief: true,
        })
        const database = new Database(this.config.app.database)
        const bot = new Bot(client, database, this.config.app.master)
        bot.login(this.config.oicq.password)
        return bot
    }

    // 该函数启动后台管理服务
    private run_mgr(bot: Bot): Manager {
        return new Manager(this.config.app.manager.host, this.config.app.manager.port, bot)
    }
}
