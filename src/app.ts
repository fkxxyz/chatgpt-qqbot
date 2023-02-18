import * as oicq from 'oicq-icalingua-plus-plus';
import {Bot} from "./bot"

// App 是该项目的入口

export class App {
    private config: any;

    constructor(config) {
        this.config = config
    }

    // 该函数启动QQ机器人
    main() {
        const client = oicq.createClient(this.config.oicq.account, {
            platform: 4,
            ignore_self: false,
            brief: true,
        })
        const bot = new Bot(client)
        bot.login(this.config.oicq.password)
    }
}
