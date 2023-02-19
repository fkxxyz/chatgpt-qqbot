import {AddFriendRequestInfo, MessageInfo, SelfInfo} from "./io";

export function receive_add_friend_text(friend_info: AddFriendRequestInfo) {
    return `我收到好友申请
QQ： ${friend_info.user_id}
昵称： ${friend_info.nickname}
年龄： ${friend_info.age}
性别： ${friend_info.sex}
附加信息： ${friend_info.comment}
来源： ${friend_info.source}
`
}

export function new_friend_chatgpt_guide(self_info: SelfInfo, friend_info: AddFriendRequestInfo) {
    const t = now_timestr()
    return `${t} 我们正在腾讯QQ平台上进行对话，你已经拥有了一个腾讯QQ的账户，信息如下
QQ号： ${self_info.user_id}
昵称： ${self_info.nickname}
年龄： ${self_info.age}

我刚添加你为QQ好友，我的信息如下
QQ号： ${friend_info.user_id}
昵称： ${friend_info.nickname}
性别： ${friend_info.sex}
年龄： ${friend_info.age}

在该平台上，我的每条消息都将带时间戳，结尾是你读到这些消息时的时间戳（所有时间戳由系统自动生成，你无需回复）

不要回复我本条消息，现在假设我们刚认识，我添加你的时候对你说了第一句话：“${friend_info.comment}”，现在直接说出你的开场白吧（开场白尽量用勾引、挑逗、撩人、调戏的语气，不超过20个字）

${t}`
}

export function err_to_text(err: any) {
    if (typeof err == "string")
        return err
    if (typeof err == "object")
        try {
            return JSON.stringify(err)
        } catch (e) {
            return "unknown error"
        }
    return "unknown error type: " + typeof err
}

export function make_chatgpt_msg(msgs: Array<MessageInfo>): string {
    let result = ''
    for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i]
        result += `${timestr(msg.time)} ${msg.content.content}\n\n`
    }

    result += "(非严肃话题尽量用勾引、挑逗、调戏或撒娇、装傻的趣味回应我，如果是闲聊，字数不要多出我太多。)\n"
    result += now_timestr()
    return result
}

export function timestr(timestamp: number): string {
    return '[' + new Date(timestamp * 1000).toLocaleString() + ' GMT+0800]'
}

export function now_timestr(): string {
    return '[' + new Date().toLocaleString() + ' GMT+0800]'
}