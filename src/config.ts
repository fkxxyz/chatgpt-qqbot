export interface Config {
    oicq: {
        data: string,
        account: number,
        password: string,
    },
    app: {
        manager: {
            host: string,
            port: number,
        }
        chatgpt: string,
        database: string,
    },
}