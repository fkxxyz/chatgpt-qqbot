import * as express from 'express';
import {Request, Response} from "express-serve-static-core";

// Manager 提供http接口，是后台管理服务，用于管理机器人行为和数据

export class Manager {
    private _i: BotSensor;

    constructor(host: string, port: number, sensor: BotSensor) {
        this._i = sensor
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
        res.json(await this._i.master.delete_friend(user_id))
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
        let reqsFriend = await this._i.master.get_friend_add_requests()
        res.json(reqsFriend)
    }
}