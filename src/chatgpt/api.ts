import axios, {AxiosInstance} from "axios";

// ChatGPT 是 ChatGPT 的 api，直接是简单地 http 调用

export class Api {
    private api: AxiosInstance;

    constructor(url: string) {
        this.api = axios.create({
            baseURL: url + "/api",
            timeout: 30000,
        });
    }

    conversations(limit: number = 20, offset: number = 0) {
        return this.api.get("/conversations", {
            params: {
                limit: limit,
                offset: offset,
            },
        });
    }

    set_title(id: string, title: string) {
        return this.api.patch("/title", Buffer.from(title, "utf-8"), {
            params: {
                id: id,
            },
        })
    }

    history(id: string) {
        return this.api.get("history", {
            params: {
                id: id,
            },
        })
    }

    send(msg: string, id: string = "", mid: string = "") {
        return this.api.post("send", msg, {
            params: {
                id: id,
                mid: mid,
            },
        })
    }

    get(mid: string) {
        return this.api.get("get", {
            params: {
                mid: mid,
            }
        })
    }
}
