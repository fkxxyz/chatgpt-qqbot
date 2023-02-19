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

function save_session() {
    let {
        password_md5,
        nickname,
        sex,
        age,
        bkn,
        cookies,
        sig,
    } = client
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
    } = client._wt
    let session_data = {
        client: {
            password_md5,
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
    fs.writeFileSync("session.json", JSON.stringify(session_data), "utf-8")
}

function on_system_online(data) {
    save_session()
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
client.on("system.online", on_system_online)
client.login(config.oicq.password)

const {getC2CMsgs} = require("oicq-icalingua-plus-plus/lib/message/history");
const {parseC2CMsg} = require("oicq-icalingua-plus-plus/lib/message/parser");
const {parseC2CMessageId} = require("oicq-icalingua-plus-plus/lib/common");
const {Gender} = require("oicq-icalingua-plus-plus");


async function get_c2c_messages(user_id, time = 1000000000000, count = 20) {
    const msgs = await getC2CMsgs.call(client, user_id, time, count)
    let result = []
    for (let i = 0; i < msgs.length; i++) {
        result.push(await parseC2CMsg.call(client, msgs[i]))
    }
    return result
}

function IdLessEqualThen(id1, id2) {
    return id1.time === id2.time ? id1.seq <= id2.seq : id1.time <= id2.time
}

function IdSub(id1, id2) {
    return id1.time === id2.time ? id1.seq - id2.seq : id1.time - id2.time
}

async function get_c2c_unread_messages(user_id, message_id) {
    const target_msg_info = parseC2CMessageId(message_id)

    // 确保获取到足够多的冗余的历史记录
    let current_time = 1000000000000
    const history = []
    while (current_time >= target_msg_info.time) {
        const msgs = await this.get_c2c_messages(user_id, current_time, 20)
        history.push(msgs)
        if (msgs.length < 20)
            break
        if (current_time === msgs[0].time) // 相等说明这1秒之内超过了20条消息，超过的部分无法获取
            current_time = msgs[0].time - 1
        else
            current_time = msgs[0].time
    }

    // 去重合并
    let history_ = []
    let i
    for (i = history.length - 1; i >= 0; i--)
        if (history[i].length !== 0)
            break
    if (i >= 0) {
        history_.push(...history[i])
        let time_remove = history[i][history[0].length - 1].time
        for (; i >= 0; i--) {
            let j
            for (j = 0; j < history[i].length; j++)
                if (history[i][j].time > time_remove)
                    break
            history_.push(...history[i].slice(j))
            time_remove = history[i][history[i].length - 1].time
        }
    }

    // 排序
    for (let i = 0; i < history_.length; i++) {
        history_[i].id_info = parseC2CMessageId(history_[i].message_id)
    }
    history_.sort((m1, m2) =>
        IdSub(m1.id_info, m2.id_info) // 按序号排序
    )

    // 去掉无效的
    let result = []
    for (let i = 0; i < history_.length; i++) {
        const msg = history_[i]
        if (IdLessEqualThen(msg.id_info, target_msg_info))
            continue
        if (msg.user_id !== user_id)
            continue
        result.push(msg)
    }
    return result
}

function format_msg(msg) {
    return {
        time: msg.time,
        seq: parseC2CMessageId(msg.message_id).seq,
        user_id: msg.user_id,
        message: msg.raw_message,
    }
}

function format_msg_i(msg) {
    return {
        time: msg.time,
        seq: parseC2CMessageId(msg.message_id).seq,
        user_id: msg.user_id,
        message: msg.raw_message,
        id: msg.message_id,
    }
}