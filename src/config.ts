export interface Config {
    oicq: {
        data: string,
        account: number,
        password: string,
    },
    app: {
        "log": {
            "file": string,
            "level": string,
        },
        master: number,
        manager: {
            host: string,
            port: number,
        }
        chatgpt: string,
        database: string,
    },
}