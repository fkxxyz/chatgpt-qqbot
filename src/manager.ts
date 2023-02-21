import * as express from 'express';
import {Request, Response} from "express-serve-static-core";
import {BotSensor} from "./bot/tought/io";

// Manager 提供http接口，是后台管理服务，用于管理机器人行为和数据

export class Manager {
    private _i: BotSensor;

    constructor(host: string, port: number, sensor: BotSensor) {
        this._i = sensor
        let app = express()
        app.get("/api/ping", this.handle_ping)
        app.get("/api/requests", this.handle_get_requests_friend_add.bind(this))
        app.delete("/api/friend", this.handle_friend_delete.bind(this))
        app.post("/api/approve", this.approve_friend_add.bind(this))
        app.post("/api/refuse", this.refuse_friend_add.bind(this))
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
        if (isNaN(user_id)) {
            res.status(400).send("bad user_id query: " + req.query.user_id)
            return
        }
        try {
            await this._i.master.delete_friend(user_id)
        } catch (err) {
            res.status(500).send("delete_friend failed: " + err.message)
            return
        }
        res.json()
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
        let reqsFriend
        try {
            reqsFriend = await this._i.master.get_friend_add_requests()
        } catch (err) {
            res.status(500).send("get_friend_add_requests failed: " + err.message)
            return
        }
        res.json(reqsFriend)
    }

    private async approve_friend_add(
        req: Request<{}, any, any, qs.ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>,
    ) {
        if (!req.query.user_id) {
            res.status(400).send("missing user_id query")
            return
        }
        let user_id = parseInt(req.query.user_id as string)
        if (isNaN(user_id)) {
            res.status(400).send("bad user_id query: " + req.query.user_id)
            return
        }
        try {
            await this._i.master.set_friend_add(user_id, true)
        } catch (err) {
            res.status(500).send("approve_friend_add failed: " + err.message)
            return
        }
        res.json()
    }

    private async refuse_friend_add(
        req: Request<{}, any, any, qs.ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>,
    ) {
        if (!req.query.user_id) {
            res.status(400).send("missing user_id query")
            return
        }
        let user_id = parseInt(req.query.user_id as string)
        if (isNaN(user_id)) {
            res.status(400).send("bad user_id query: " + req.query.user_id)
            return
        }
        try {
            await this._i.master.set_friend_add(user_id, false)
        } catch (err) {
            res.status(500).send("approve_friend_add failed: " + err.message)
            return
        }
        res.json()
    }
}