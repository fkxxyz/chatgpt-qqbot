const fs = require('fs')
const oicq = require('oicq-icalingua-plus-plus')
const configPath = './.test.pro.json'
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const client = oicq.createClient(config.oicq.account, {
    platform: 4,
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
    let session_data = JSON.parse(fs.readFileSync(path.join(config.oicq.data, config.oicq.account.toString(), "session.json"), "utf-8"))
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
