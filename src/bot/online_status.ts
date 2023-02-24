import * as jce from "oicq-icalingua-plus-plus/lib/algo/jce";

export enum OnlineStatus {
    Unknown = 0, // 未知
    Online = 11, // 我在线上
    Offline = 21, // 离线
    Away = 31, // 离开
    Invisible = 41, // 隐身
    Busy = 50, // 忙碌
    Qme = 60, // Q 我吧
    Dnd = 70, // 请勿打扰
    ReceiveOfflineMsg = 95, // 离线但接收消息
    Battery = 1000, // 当前电量
    Listening = 1028, // 听歌中
    Constellation = 1040, // 星座运势
    Weather = 1030, // 今日天气
    MeetSpring = 1069, // 遇见春天
    Timi = 1027, // Timi中
    EatChicken = 1064, // 吃鸡中
    Loving = 1051, // 恋爱中
    WangWang = 1053, // 汪汪汪
    CookedRice = 1019, // 干饭中
    Study = 1018, // 学习中
    StayUp = 1032, // 熬夜中
    PlayBall = 1050, // 打球中
    Signal = 1011, // 信号弱
    StudyOnline = 1024, // 在线学习
    Gaming = 1017, // 游戏中
    Vacationing = 1022, // 度假中
    WatchingTV = 1021, // 追剧中
    Fitness = 1020, // 健身中
}

export async function set_online_status(
    online_status: OnlineStatus,
    battery_status: number = 0,
    is_power_connected: boolean = false,
) {
    if (battery_status < 0 || battery_status > 100)
        throw new Error("bad battery_status");
    let basic_online_status = online_status as number
    let ext_online_status = online_status as number
    if (online_status < 1000)
        ext_online_status = 0
    else
        basic_online_status = OnlineStatus.Online as number;
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
        (this as any).online_status = online_status;
    }
    return {result};
}