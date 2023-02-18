const fs = require('fs')
const oicq = require('oicq-icalingua-plus-plus')
const configPath = './.test.config.json'
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const client = oicq.createClient(config.oicq.account, {
    platform: 4,
    data_dir: config.oicq.data,
    ignore_self: false,
    brief: true,
})

function on_system_login_slider(data) {
    console.log("需要滑动验证码")
    client.terminate()
}

function on_system_login_device(data) {
    console.log("需要锁验证")
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

let msgs = []

function message_private_friend(data) {
    msgs.push(data)
}

client.on("system.login.slider", on_system_login_slider)
client.on("system.login.device", on_system_login_device)
client.on("system.login.qrcode", on_system_login_qrcode)
client.on("system.login.error", on_system_login_error)
client.on("message.private.friend", message_private_friend)
client.login(config.oicq.password)
