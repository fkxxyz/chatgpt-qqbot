const fs = require('fs')
const oicq = require('oicq-icalingua-plus-plus')
const configPath = './.test.config.json'
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const client = oicq.createClient(config.oicq.account, {
    platform: 5,
    data_dir: config.oicq.data,
    ignore_self: false,
    brief: true,
    resend: false,
    reconn_interval: 0,
    auto_server: false,
})

function on_system_login_slider(data) {
    console.log("需要滑动验证码")
    client.terminate()
}

function on_system_login_device(data) {
    console.log("需要登录设备验证")
    client.terminate()
}

function on_system_login_qrcode(data) {
    console.log("需要二维码验证")
    client.terminate()
}

function on_system_login_error(data) {
    console.log(`登录错误 ${data.code} ： ${data.message}`)
    client.terminate()
}

client.on("system.login.slider", on_system_login_slider)
client.on("system.login.device", on_system_login_device)
client.on("system.login.qrcode", on_system_login_qrcode)
client.on("system.login.error", on_system_login_error)

const {onlineListener} = require("oicq-icalingua-plus-plus/lib/oicq");

function load_session() {
    let session_data = JSON.parse(fs.readFileSync(path.join(client.dir, "session.json"), "utf-8"))
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

client._connect(() => {
    load_session()
    onlineListener.call(client).then()
});

const jce = require("oicq-icalingua-plus-plus/lib/algo/jce");

async function set_online_status(
    online_status,
    battery_status = 0,
    is_power_connected = false,
) {
    if (battery_status < 0 || battery_status > 100)
        throw new Error("bad battery_status");
    let basic_online_status = online_status
    let ext_online_status = online_status
    if (online_status < 1000)
        ext_online_status = 0
    else
        basic_online_status = 11;
    if (is_power_connected)
        battery_status += 128

    const timestamp = Math.floor(new Date().getTime() / 1000)
    const SvcReqRegister = jce.encodeStruct([
        this.uin, 7, 0, "", basic_online_status, 0, 0, 0, 0, 0,
        timestamp, this.device.version.sdk, 1, "", 0, null, this.device.guid, 2052, 0, this.device.model,
        this.device.model, this.device.version.release, 1, 0, 0, null, 0, 0, "", 0,
        "", "", "", null, 1, null, 0, null, ext_online_status, battery_status,
    ]);
    const extra = {
        req_id: this.seq_id + 1,
        service: "PushService",
        method: "SvcReqRegister",
    };
    const body = jce.encodeWrapper({SvcReqRegister}, extra);
    const blob = await this.sendUni("StatSvc.SetStatusFromClient", body);
    const rsp = jce.decode(blob);
    let result = -1;
    if (rsp[9]) {
        result = 0;
        this.online_status = online_status;
    }
    return {result, rsp};
}