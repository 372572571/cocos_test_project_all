// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
import { HotUpdateConfig } from './config/HotUpdateConfig';
import { DownloadsPromise } from '../../hall/script/download/DownLoad';
import { UpdateGame, UPDATE_TYPE } from '../../hall/script/download/UpdateGame';
const { ccclass, property } = cc._decorator;
const PROJECT_MANIFEST = 'project.manifest'
const VERSION_MANIFEST = 'version.manifest'
@ccclass
export default class start extends cc.Component {

    public root_path: string = '';

    public start() {
        if (!cc.sys.isNative) {
            cc.director.loadScene('hall')
            return
        }
        this.root_path = jsb.fileUtils.getWritablePath()
        this.HotUpdate()
    }

    // 判断关键热更文件是否存在
    public async HotUpdateFile(): Promise<any> {
        let path = this.root_path;
        let res: any = { path: `${path}/${PROJECT_MANIFEST}` };
        console.log('jsw 查找文件', res.path)
        if (!jsb.fileUtils.isFileExist(`${path}/${PROJECT_MANIFEST}`)) {
            let down = new DownloadsPromise();
            res = await down.startDownLoad(`${HotUpdateConfig.HotUpdateUrl}${cc.sys.localStorage.getItem('PackMd5')}`, PROJECT_MANIFEST)
        }

        let promise = new Promise((resolve, rejects) => {
            if (res.path && jsb.fileUtils.isFileExist(path)) {
                console.log('jsw 文件是否存在', jsb.fileUtils.isFileExist(path));
                resolve(res)
            } else {
                rejects('下载失败')
            }
        })
        return promise;
    }

    // 热更新默认模块
    public async HotUpdate() {
        let res = await this.HotUpdateFile()
        if (!res.path) {
            console.log('jsw 下载清单失败', res);
            return
        }
        let updateGame = new UpdateGame()
        updateGame.Run({
            url: HotUpdateConfig.HotUpdateUrl,
            storagePath: 'test-default',
            customManifestStr: `${this.root_path}${PROJECT_MANIFEST}`
        }, (res) => {
            console.log('jsw 热更消息', res)
            switch (res) {
                case UPDATE_TYPE.LATEST: // 最新版本流程
                    // 缺少子游戏检查
                    cc.director.loadScene('hall')
                    break;
                case UPDATE_TYPE.OVER: // 更新完毕需要重新启动
                    cc.game.restart()
                    break;
                default:
                    console.log('jsw 热更新失败流程')
            }
        })
    }
}
