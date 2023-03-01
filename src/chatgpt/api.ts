import axios, {AxiosInstance} from "axios";

// ChatGPT 是 ChatGPT 的 api，直接是简单地 http 调用

export class Api {
    private api: AxiosInstance;

    constructor(url: string) {
        this.api = axios.create({
            baseURL: url + "/api",
            timeout: 600000,
        });
    }

    set_title(account: string, id: string, title: string) {
        return this.api.patch("/title", Buffer.from(title, "utf-8"), {
            params: {
                account: account,
                id: id,
            },
        })
    }

    history(account: string, id: string) {
        return this.api.get("history", {
            params: {
                account: account,
                id: id,
            }
        })
    }

    send(account: string, msg: string, id: string = "", mid: string = "") {
        return this.api.post("/send", msg, {
            params: {
                account: account,
                id: id,
                mid: mid,
            },
        })
    }

    get(mid: string) {
        return this.api.get("/get", {
            params: {
                mid: mid,
            }
        })
    }
}
