import * as oicq from "oicq-icalingua-plus-plus";

export class BotLogin {
    private readonly client: oicq.Client;

    constructor(client: oicq.Client) {
        this.client = client

        this.client.on("system.login.slider", this.on_system_login_slider)
        this.client.on("system.login.device", this.on_system_login_device)
        this.client.on("system.login.qrcode", this.on_system_login_qrcode)
        this.client.on("system.login.error", this.on_system_login_error)

        this.client.on("system.online", this.on_system_online)
        this.client.on("system.offline.network", this.on_system_offline_network)
        this.client.on("system.offline.kickoff", this.on_system_offline_kickoff)
        this.client.on("system.offline.frozen", this.on_system_offline_frozen)
        this.client.on("system.offline.unknown", this.on_system_offline_unknown)
    }

    login(password: string) {
        this.client.login(password)
    }

    private on_system_login_slider(data: oicq.SliderEventData) {
        console.log("需要滑动验证码")
        this.client.terminate()
    }

    private on_system_login_device(data: oicq.DeviceEventData) {
        console.log("需要锁验证")
        this.client.terminate()
    }

    private on_system_login_qrcode(data: oicq.QrcodeEventData) {
        console.log("需要二维码验证")
        this.client.terminate()
    }

    private on_system_login_error(data: oicq.LoginErrorEventData) {
        console.log(`登录错误 ${data.code} ： ${data.message}`)
        this.client.terminate()
    }


    private on_system_online(data: oicq.OnlineEventData) {
        console.log(`上线`)
    }

    private on_system_offline_network(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
    }

    private on_system_offline_kickoff(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
    }

    private on_system_offline_frozen(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
    }

    private on_system_offline_unknown(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
    }
}