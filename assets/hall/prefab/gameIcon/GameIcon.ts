import { Downloads, DownLoadInfo, DownLoadError, DownLoadSuccess } from '../../script/download/DownLoad'
import { ChildHotUpdate, UPDATE_TYPE } from '../../script/download/ChildHotUpdate'
import { HotUpdateConfig } from '../../../start/script/config/HotUpdateConfig'
import { promises } from 'dns';
import { rejects } from 'assert';

const _MANIFEST_NAME_: string = "project.manifest"; // 清单文件名
const _VERSION_NAME_: string = "version.manifest"; // 版本文件名

// 游戏状态枚举
export enum GAME_TYPE {
    NOT = 0,
    READY = 1,
    UPDATE = 2,
    CHECK_UPDATE = 3, // 检查更新时,锁定游戏
    ERROR = 4, // 游戏异常
}

const { ccclass, property } = cc._decorator;
@ccclass
export class GameIcon extends cc.Component {

    @property({ type: cc.Label, displayName: "游戏名称" })
    public gameName: cc.Label = null;
    @property({ type: cc.Label, displayName: "状态" })
    public type: cc.Label = null;
    @property({ displayName: "游戏标识符" })
    public flag: string = '';

    @property(cc.ProgressBar)
    private _progressBar: cc.ProgressBar = null;

    private _type: GAME_TYPE = 3;

    private childHotUpdate: ChildHotUpdate
    private _childHotUpdate_lock = false;
    private _root_path: string = '';

    public onLoad(): void {
        this.gameName.string = this.flag;
        this.childHotUpdate = new ChildHotUpdate()
        this._root_path = jsb.fileUtils.getWritablePath()
        this.getGameType()
        this.upType()
        if (this._type === GAME_TYPE.NOT) { return }; // 如果游戏没有下载不用检测更新
        this.checkUpdate().then(res => {
            console.log('jsw 更新检测完成 code = ', res)
            this.upType()
        }).catch(err => {
            console.log('jsw 更新检测异常 ', err)
            this._type = GAME_TYPE.ERROR;
            this.upType()
        })

    }

    /**
     *  更新检查
     */
    public async checkUpdate(): Promise<{}> {

        let res = await this.childHotUpdate.FindUpdate({
            url: HotUpdateConfig.HotUpdateUrl,
            storagePath: `${this.flag}`,
            path: `${this._root_path}${_MANIFEST_NAME_}`
        })
        return new Promise((resolve, rejects) => {
            switch (res) {
                case UPDATE_TYPE.LATEST:
                    this._type = GAME_TYPE.READY;
                    break
                case UPDATE_TYPE.NEED_UPDATE:
                    this._type = GAME_TYPE.UPDATE;
                    break
            }
            this.upType()

            resolve(res);
        })
    }

    public hotUpdate() {

        this._childHotUpdate_lock = true

        console.log('jsw 开始更新 hotUpdate:', this.flag)
        this.childHotUpdate.Run(
            {
                url: `${HotUpdateConfig.HotUpdateUrl + this.flag}/`,
                storagePath: `${this.flag}`,
                customManifestStr: `${this._root_path}${this.flag}/${_MANIFEST_NAME_}`,
            },
            (res) => {
                console.log('jsw 热更消息', res)
                switch (res) {
                    case UPDATE_TYPE.LATEST: // 最新版本流程
                        console.log('jsw 热更消息 已经是最新', res);
                        this._type = GAME_TYPE.READY;
                        break;
                    case UPDATE_TYPE.OVER: // 更新完毕
                        console.log('jsw 热更消息 更新完毕', res);
                        this._type = GAME_TYPE.READY;
                        break;
                    default:
                        this._type = GAME_TYPE.ERROR;
                        console.log('jsw 热更新失败流程');
                }
                this.upType()

            }
        )
    }

    /**
     *  更新游戏状态
     */
    public upType(): void {
        switch (this._type) {
            case GAME_TYPE.NOT:
                this.type.string = '未下载';
                break;
            case GAME_TYPE.READY:
                this.type.string = '';
                break;
            case GAME_TYPE.UPDATE:
                this.type.string = '更新游戏'
                break
            case GAME_TYPE.CHECK_UPDATE:
                this.type.string = '检查更新';
                break
            default:
                this.type.string = '游戏异常'
                break
        }
    }

    /**
     * 获取清单文件完整名称
     *
     * @readonly
     * @private
     * @type {string}
     * @memberof GameIcon
     */
    private get MANIFEST_NAME(): string {
        return `${_MANIFEST_NAME_}`;
    }

    /**
     * 程序可读写路径
     *
     * @readonly
     * @private
     * @type {string}
     * @memberof GameIcon
     */
    private get WRITABLE_DIRECTORY(): string {
        return jsb.fileUtils.getWritablePath();
    }

    /**
     * 获取版本文件完整名称
     *
     * @readonly
     * @private
     * @type {string}
     * @memberof GameIcon
     */
    private get VERSION_NAME(): string {
        return `${_VERSION_NAME_}`;
    }

    /**
     * 设置进度条
     *
     * @memberof GameIcon
     */
    public set progress(val: number) {
        this._progressBar.progress = val;
    }

    /**
     * 获取当前游戏状态
     *
     * @returns {number}
     * @memberof GameIcon
     */
    public getGameType(): number {
        if (!cc.sys.isNative) {
            this._type = GAME_TYPE.READY;
            return this._type; //如果当前不在原生系统默认返回ready
        }
        // 判断游戏是否下载
        if (!this.isDownloads()) {
            this._type = GAME_TYPE.NOT;
            return this._type;
        }
        // 判断游戏是否需要更新暂缺
        return this._type;
    }

    // 下载游戏
    public downLoadGame(url: string, call?: (bool: boolean) => void) {
        // if (this.getGameType() !== GAME_TYPE.NOT) {
        //     console.log('jsw 游戏已下载')
        //     return;
        // }
        let down = new Downloads();
        down.error = () => {
            call && call(false)
            console.log('jsw downLoadGame 下载失败')
        };
        // down.schedule = call_obj.schedule;
        down.success = (res) => {
            console.log('jsw downLoadGame 下载成功', res.path)
            let temp = this.unzip(res.path, `${this.WRITABLE_DIRECTORY}`)
            console.log('jsw 解压结果', temp);
            if (temp) { // 完成
                this._type = GAME_TYPE.CHECK_UPDATE
                this.upType()
                call && call(true)
            }
            call && call(false)
        };
        down.startDownLoad(`${url}/${this.flag}.zip`)
    }

    /**
     * 判断文件是否下载
     * 1. 判断路径是否存在
     * 2. 判断热更文件&版本文件是否存在
     * 3. 如上都存在返回true
     * @private
     * @returns {boolean}
     * @memberof GameIcon
     */
    private isDownloads(): boolean {
        // 如果不存在标识符
        if (this.flag === '') return false;

        // 如果对应标识符的路径不存在
        if (!jsb.fileUtils.isDirectoryExist(`${this.WRITABLE_DIRECTORY}${this.flag}`)) return false;

        // if hot Update file is not exist
        console.log('jsw 子游戏查找清单', `${this.WRITABLE_DIRECTORY}${this.flag}/${this.MANIFEST_NAME}`)
        if (!jsb.fileUtils.isFileExist(`${this.WRITABLE_DIRECTORY}${this.flag}/${this.MANIFEST_NAME}`)) return false;

        return true;
    }

    /**
     * 解压zip文件
     *
     * @private
     * @param {string} zip_path // zip文件的路径
     * @param {string} tag_path // 目标文件夹路径
     * @returns {boolean}
     * @memberof GameIcon
     */
    private unzip(zip_path: string, tag_path: string): boolean {
        let res = false;
        if (!jsb.fileUtils.isDirectoryExist(tag_path)) {
            jsb.fileUtils.createDirectory(tag_path)
        }
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // res = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "unZip", "(Ljava/lang/String;Ljava/lang/String;)Z", zip_path, tag_path)
            if (jsb.zip) {
                console.log('zip 存在')
            } else {
                console.log('zip 不存在')
            }
            res = jsb.zip.unzip(zip_path, tag_path)
        }
        console.log('jsw 解压完成', res)
        return res;
    }

}

