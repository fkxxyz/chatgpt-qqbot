import axios, {AxiosInstance} from "axios";

// ChatGPT 是 ChatGPT 的 api

export class ChatGPT {
    private api: AxiosInstance;

    constructor(url: string) {
        this.api = axios.create({
            url: url,
            baseURL: "/api",
            timeout: 30000,
        });
    }

}
