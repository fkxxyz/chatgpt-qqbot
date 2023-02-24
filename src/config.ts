export interface Config {
    oicq: {
        platform: number,
        data: string,
        account: number,
        password: string,
    },
    app: {
        log: {
            file: string,
            level: string,
        },
        masters: Array<number>,
        manager: {
            host: string,
            port: number,
        }
        chatgpt: string,
        database: string,
    },
}