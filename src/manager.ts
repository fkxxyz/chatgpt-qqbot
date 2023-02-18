import * as express from 'express';
import {Request, Response} from "express-serve-static-core";
import {Bot} from "./bot";

// Manager 提供http接口，是后台管理服务，用于管理机器人行为和数据

export class Manager {
    private bot: Bot;

    constructor(host: string, port: number, bot: Bot) {
        this.bot = bot
        let app = express()
        app.get("/api/ping", this.handle_ping)
        app.get("/api/requests", this.handle_get_requests_friend_add.bind(this))
        app.delete("/api/friend", this.handle_friend_delete.bind(this))
        app.listen(port, host)
        console.log(`listening on http://${host}:${port}`)
    }

    private async handle_friend_delete(
        req: Request<{}, any, any, qs.ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>,
    ) {
        if (!req.query.user_id) {
            res.status(400).send("missing user_id query")
            return
        }
        let user_id = parseInt(req.query.user_id as string)
        res.send(await this.bot.delete_friend(user_id))
    }

    private handle_ping(
        req: Request<{}, any, any, qs.ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>,
    ) {
        res.send('hello fkxxyz!')
    }

    private async handle_get_requests_friend_add(
        req: Request<{}, any, any, qs.ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>,
    ) {
        let reqsOicq = await this.bot.get_requests_friend_add()
        let reqs = []
        for (let i = 0; i < reqsOicq.length; i++) {
            reqs.push({
                id: reqsOicq[i].flag,
                comment: reqsOicq[i].comment, //附加信息
                source: reqsOicq[i].source, //来源(如"条件查找")
                age: reqsOicq[i].age,
                sex: reqsOicq[i].sex as string,
            })
        }
        res.json(reqs)
    }
}