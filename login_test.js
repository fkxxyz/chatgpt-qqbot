const fs = require('fs')
const {spawn} = require('child_process');
const oicq = require('oicq-icalingua-plus-plus')
const configPath = './.test.config.json'
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const client = oicq.createClient(config.oicq.account, {
    platform: 4,
    data_dir: config.oicq.data,
    ignore_self: false,
    brief: true,
})


async function runCommand(command, args) {
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


function on_system_login_slider(data) {
    console.log("需要滑动验证码")
    client.terminate()
}

function on_system_login_device(data) {
    client.sendSMSCode();
    runCommand("zenity", ["--entry", "--text=输入密保手机收到的短信验证码"]).then(data => {
        client.submitSMSCode(data.trim());
    })
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

const {onlineListener} = require("oicq-icalingua-plus-plus/lib/oicq");
const {getC2CMsgs} = require("oicq-icalingua-plus-plus/lib/message/history");
const {parseC2CMsg} = require("oicq-icalingua-plus-plus/lib/message/parser");
const {parseC2CMessageId} = require("oicq-icalingua-plus-plus/lib/common");
const {Gender, Domain, Sig} = require("oicq-icalingua-plus-plus");


async function get_c2c_messages(user_id, time = 1000000000000, count = 20) {
    const msgs = await getC2CMsgs.call(client, user_id, time, count)
    let result = []
    for (let i = 0; i < msgs.length; i++) {
        result.push(await parseC2CMsg.call(client, msgs[i]))
    }
    return result
}

function load_session() {
    let session_data = JSON.parse(fs.readFileSync("session.json", "utf-8"))
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

get_c2c_messages(396519827).then(
    d => console.log(d)
)
