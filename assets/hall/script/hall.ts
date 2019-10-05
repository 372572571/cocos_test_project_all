// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
import { HotUpdateConfig } from '../../start/script/config/HotUpdateConfig';
import { GameIcon, GAME_TYPE } from '../prefab/gameIcon/GameIcon'

const { ccclass, property } = cc._decorator;

@ccclass
export default class hall extends cc.Component {
    private _is_lock = false

    start() {
        // cc.sys.isNative && console.log('jsw 搜索路径', jsb.fileUtils.getSearchPaths())
    }

    public onDownLoad(event: cc.Event.EventTouch) {
        cc.sys.isNative && console.log('jsw 搜索路径', JSON.stringify(jsb.fileUtils.getSearchPaths()))
        let script = (event.currentTarget as cc.Node).getComponent(GameIcon)

        // console.log('jsw 当前游戏状态', script.getGameType())
        console.log('jsw 当前锁状态', this._is_lock);
        if (script.getGameType() === GAME_TYPE.READY) {  // 可以进入游戏流程
            console.log('进入碰碰车');
            cc.director.loadScene('ppc');
            return
        }
        // if (script.getGameType() === GAME_TYPE.UPDATE || script.getGameType() === GAME_TYPE.CHECK_UPDATE) {  // 需要更新的流程
        //     console.log('启动游戏更新');
        //     script.hotUpdate()
        //     return;
        // }

        // 下载流程
        if (!this._is_lock) {
            this._is_lock = true
            // 下载游戏
            script.downLoadGame(HotUpdateConfig.HotUpdateUrl, (bool: boolean) => {
                this._is_lock = false
            })
        }
    }
}
