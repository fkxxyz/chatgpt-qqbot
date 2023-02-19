import * as oicq from "oicq-icalingua-plus-plus";
import {spawn} from "child_process";
import * as fs from "fs";
import path = require("node:path");
import assert = require("node:assert");

const {onlineListener} = require("oicq-icalingua-plus-plus/lib/oicq");

async function runCommand(command, args): Promise<string> {
    const childProcess = spawn(command, args);

    return new Promise((resolve, reject) => {
        let stdout = '';
        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        childProcess.on('exit', (code, signal) => {
            if (code !== 0) {
                reject(new Error(`Command failed with exit code ${code}`));
            } else {
                resolve(stdout);
            }
        });
    });
}

export class BotLogin {
    private readonly client: oicq.Client;
    private loaded_session: boolean;

    constructor(client: oicq.Client) {
        client.config.resend = false
        client.config.reconn_interval = 0
        client.config.auto_server = false
        this.client = client
        this.loaded_session = false

        this.client.on("system.login.slider", this.on_system_login_slider.bind(this))
        this.client.on("system.login.device", this.on_system_login_device.bind(this))
        this.client.on("system.login.qrcode", this.on_system_login_qrcode.bind(this))
        this.client.on("system.login.error", this.on_system_login_error.bind(this))

        this.client.on("system.online", this.on_system_online.bind(this))
        this.client.on("system.offline.network", this.on_system_offline_network.bind(this))
        this.client.on("system.offline.kickoff", this.on_system_offline_kickoff.bind(this))
        this.client.on("system.offline.frozen", this.on_system_offline_frozen.bind(this))
        this.client.on("system.offline.unknown", this.on_system_offline_unknown.bind(this))
    }

    public login(password: string) {
        this.client.login(password)
    }

    public login_with_session() {
        (this.client as any)._connect(() => {
            this.loaded_session = true
            this.load_session()
            onlineListener.call(this.client).then()
        });
    }

    private save_session() {
        let {
            uin,
            password_md5,
            nickname,
            sex,
            age,
            bkn,
            cookies,
            sig,
        } = this.client
        let {
            ecdh,
            t104,
            t106,
            t174,
            phone,
            token_flag,
            session_id,
            random_key,
            qrcode_sig,
        } = this.client["_wt"]
        let session_data = {
            client: {
                uin,
                password_md5,
                nickname,
                sex,
                age,
                bkn,
                cookies,
                sig,
            },
            wt: {
                ecdh,
                t104,
                t106,
                t174,
                phone,
                token_flag,
                session_id,
                random_key,
                qrcode_sig,
            }
        }
        fs.writeFileSync(path.join(this.client.dir, "session.json"), JSON.stringify(session_data), "utf-8")
    }

    private load_session() {
        let session_data = JSON.parse(fs.readFileSync(path.join(this.client.dir, "session.json"), "utf-8"))
        let client = this.client as any
        client.password_md5 = session_data.client.password_md5
        client.nickname = session_data.client.nickname
        client.sex = session_data.client.sex
        client.age = session_data.client.age
        client.cookies = session_data.client.cookies
        client.sig = session_data.client.sig
        let keys = Object.keys(session_data.client.sig)
        for (let i = 0; i < keys.length; i++) {
            if (client.sig[keys[i]].type === 'Buffer') {
                client.sig[keys[i]] = Buffer.from(session_data.client.sig[keys[i]].data)
            }
        }
        assert(client.bkn == session_data.client.bkn)
        client._wt.ecdh = session_data.wt.ecdh
        client._wt.t104 = session_data.wt.t104
        client._wt.t106 = session_data.wt.t106
        client._wt.t174 = session_data.wt.t174
        client._wt.phone = session_data.wt.phone
        client._wt.token_flag = session_data.wt.token_flag
        client._wt.session_id = session_data.wt.session_id
        client._wt.random_key = session_data.wt.random_key
        client._wt.qrcode_sig = session_data.wt.qrcode_sig
        keys = Object.keys(session_data.wt)
        for (let i = 0; i < keys.length; i++) {
            if (client._wt[keys[i]].type === 'Buffer') {
                client._wt[keys[i]] = Buffer.from(session_data.wt[keys[i]].data)
            }
        }
        keys = Object.keys(session_data.wt.ecdh)
        for (let i = 0; i < keys.length; i++) {
            if (client._wt.ecdh[keys[i]].type === 'Buffer') {
                client._wt.ecdh[keys[i]] = Buffer.from(session_data.wt.ecdh[keys[i]].data)
            }
        }
    }

    private on_system_login_slider(data: oicq.SliderEventData) {
        console.log("需要滑动验证码")
        this.client.terminate()
        process.exit(1)
    }

    private on_system_login_device(data: oicq.DeviceEventData) {
        this.client.sendSMSCode();
        runCommand("zenity", ["--entry", "--text=输入密保手机收到的短信验证码"]).then(s => {
            this.client.submitSMSCode(s.trim());
        })
    }

    private on_system_login_qrcode(data: oicq.QrcodeEventData) {
        console.log("需要二维码验证")
        this.client.terminate()
        process.exit(1)
    }

    private on_system_login_error(data: oicq.LoginErrorEventData) {
        console.log(`登录错误 ${data.code} ： ${data.message}`)
        this.client.terminate()
        process.exit(1)
    }


    private on_system_online(data: oicq.OnlineEventData) {
        console.log(`上线`)
        if (!this.loaded_session)
            this.save_session()
    }

    private on_system_offline_network(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
    }

    private on_system_offline_kickoff(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
        process.exit(1)
    }

    private on_system_offline_frozen(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
        process.exit(1)
    }

    private on_system_offline_unknown(data: oicq.OfflineEventData) {
        console.log(`掉线： ${data.message}`)
        this.client.terminate()
        process.exit(1)
    }
}