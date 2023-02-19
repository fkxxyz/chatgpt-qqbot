export interface Config {
    oicq: {
        data: string,
        account: number,
        password: string,
    },
    app: {
        master: number,
        manager: {
            host: string,
            port: number,
        }
        chatgpt: string,
        database: string,
    },
}