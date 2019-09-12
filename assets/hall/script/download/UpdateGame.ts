import { Point } from "../../prefab/point/point"

export enum UPDATE_TYPE {
    LATEST = 'latest', // 已经是最新版本
    ERROR = 'error',   // 更新失败
    OVER = 'over',     // 更新结束
}

export class UpdateGame {
    private _packageUrl: string = null; // 热更包地址
    private _remoteManifest: string = 'project.manifest'; // 远程清单文件名称
    private _remoteVersion: string = 'version.manifest'; // 远程版本文件名称
    private _storagePath: string = ''// 下载路径
    private _finishCallback: (res: any) => void = null; // 回调函数
    private _am: any;
    private _manifestUrl: any = null;// 本地清单文件
    private _hotUpdateIng: boolean = false
    private _updating: boolean = false;
    private debug: Point = null
    private failMsgNum = 0;

    /**
     * 获取远程清单url
     *
     * @readonly
     * @type {string}
     * @memberof UpdateGame
     */
    public get remoteManifest(): string {
        return this._packageUrl + this._remoteManifest;
    }

    /**
     * 获取远程版本url
     *
     * @readonly
     * @type {string}
     * @memberof UpdateGame
     */
    public get remoteVersion(): string {
        return this._packageUrl + this._remoteVersion;
    }

    /**
     * 创建一个空清单
     *
     * @static
     * @param {string} url
     * @param {string} remoteManifest
     * @param {string} remoteVersion
     * @returns {string}
     * @memberof UpdateGame
     */
    public static createEmptyManifest(url: string, remoteManifest: string, remoteVersion: string): string {
        return JSON.stringify({
            "packageUrl": url,
            "remoteManifestUrl": url + "/" + remoteManifest,
            "remoteVersionUrl": url + "/" + remoteVersion,
            "version": "0.0.1",
            "assets": {},
            "searchPaths": []
        });
    }


    /**
     * 版本比较
     *
     * @private
     * @param {string} versionA
     * @param {string} versionB
     * @returns {number}
     * @memberof UpdateGame
     */
    private versionCompare(versionA: string, versionB: string): number {
        this.log(`校验版本 A:${versionA} B:${versionB}`)
        var vA: string[] = versionA.split('.');
        var vB: string[] = versionB.split('.');
        for (var i = 0; i < vA.length; ++i) {
            var a = Number(vA[i]);
            var b = Number(vB[i]) || 0
            if (a === b) {
                continue;
            }
            else {
                return a - b;
            }
        }
        if (vB.length > vA.length) {
            return -1;
        }
        else {
            return 0;
        }
    }

    /**
     * 文件校验
     *
     * @private
     * @param {string} path
     * @param {*} asset
     * @returns {boolean}
     * @memberof UpdateGame
     */
    private verifyCallback(path: string, asset: any): boolean {
        let fileMd5 = this.FileToMd5(path)
        let res = asset.md5 == fileMd5
        console.log("jsw:", asset.md5, fileMd5)
        let re = new RegExp('(project.manifest){1}$')
        if (re.test(path)) {
            console.log('过滤神坑md5')
            return true
        }
        if (res) {
            // this.debug.setText('文件校验成功');
            console.log('文件校验成功')
        } else {
            // this.debug.setText('文件校验失败');
            console.log('文件校验失败');
            if (jsb.fileUtils.isFileExist(path)) {
                jsb.fileUtils.removeFile(path);
            }
        }
        return res // 文件验证

    }

    /**
     * 获取文件md5
     *
     * @private
     * @param {string} filePath
     * @returns {string}
     * @memberof UpdateGame
     */
    private FileToMd5(filePath: string): string {
        let data: Uint8Array = jsb.fileUtils.getDataFromFile(filePath);
        console.log("jsw:文件类型", typeof data)
        return this.md5(data);
    }


    /**
     * 运行热更
     *
     * @param {{ url: string, storagePath: string, manifestUrl: any }} data
     * @param {(res: any) => void} finishCallback
     * @returns {void}
     * @memberof UpdateGame
     */
    public Run(data: { url: string, storagePath: string, customManifestStr: string }, finishCallback: (res: any, other?: any) => void): void {
        if (!cc.sys.isNative) return; // 如果不是手机
        console.log('jsw Run update')
        console.log('jsw customManifestStr', data.customManifestStr)
        // this.debug = cc.find('Canvas/point').getComponent(Point)
        // this.debug && this.debug.setTitle('Run')
        this._packageUrl = data.url;
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + `${data.storagePath}`);
        this._manifestUrl = data.customManifestStr;
        // 结束回调
        this._finishCallback = finishCallback;
        // 远程资源管理器
        this._am = new jsb.AssetsManager(this._packageUrl, this._storagePath, this.versionCompare.bind(this))
        // 设置文件对比回调函数
        this._am.setVerifyCallback(this.verifyCallback.bind(this))
        // 安卓并发下载处理
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            this._am.setMaxConcurrentTask(2);
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            console.log('jsw Run update loadLocalManifest')
            // var url = this._manifestUrl;
            // if ((<any>cc.loader).md5Pipe) {
            //     url = (<any>cc.loader).md5Pipe.transformURL(url);
            // }
            // var manifest = new jsb.Manifest(this._manifestUrl, this._storagePath);
            this._am.loadLocalManifest(this._manifestUrl);
        }
        console.log('jsw Run update loadLocalManifest over')
        // 加载本地清单失败
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            console.log('Failed to load local manifest ...');
            this.log('Failed to load local manifest ...')
            this._finishCallback(UPDATE_TYPE.ERROR);
            this.reset()
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));
        this._am.checkUpdate();
        this._updating = true
        this._hotUpdateIng = false;
    }

    /**
     * 检查清单文件
     *
     * @private
     * @param {*} event
     * @memberof UpdateGame
     */
    private checkCb(event: any): void {
        let failMsg;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                failMsg = 'No local manifest file found.';
                this.log('No local manifest file found.')
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST: // 错误的下载清单
                failMsg = 'Fail to download manifest file!';
                this.log('Fail to download manifest file!')
                break
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                failMsg = 'Fail PARSE manifest file.';
                this.log('Fail PARSE manifest file.')
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log('Already up to date with the latest remote version.');
                this.log('Already up to date with the latest remote version.')
                this._finishCallback(UPDATE_TYPE.LATEST);
                this.reset();
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                console.log('New version found, please try to update.');
                this.log('New version found, please try to update.')
                this.hotUpdate();
                break;
            case jsb.EventAssetsManager.READY_TO_UPDATE:
                // 准备更新
                break;
            default:
                break;
        }

        if (failMsg) {
            console.log('check callback: ' + failMsg);
            this.log('check callback: ' + failMsg)
            // GameUpdate.showFailDialog(failMsg);
        }
    }

    /**
     * 开始更新
     *
     * @private
     * @returns {void}
     * @memberof UpdateGame
     */
    private hotUpdate(): void {
        if (this._hotUpdateIng) {
            return;
        }
        this._updating = true;

        console.log('hotUpdate');
        this.log('hotUpdate')
        if (this._am) {
            console.log('hotUpdateRun!');
            this._hotUpdateIng = true;
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                // var url = this._manifestUrl;
                // if ((<any>cc.loader).md5Pipe) {
                //     url = (<any>cc.loader).md5Pipe.transformURL(url);
                // }
                // var manifest = new jsb.Manifest(this._manifestUrl, this._storagePath);
                this._am.loadLocalManifest(this._manifestUrl.customManifestStr);
                console.log('hotUpdate 加载清单');
            }

            this._am.update();
        }
    }

    /**
     * 更新回调
     *
     * @private
     * @param {*} event
     * @returns {void}
     * @memberof UpdateGame
     */
    private updateCb(event: any): void {
        let needRestart = false;
        let failMsg;
        // let loadingNode = cc.find('Canvas/backdrop/loadMod');
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.UPDATE_PROGRESSION: {
                // 更新进度

                break;
            }
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                failMsg = 'No local manifest file found, hot update skipped.';
                this.log('No local manifest file found, hot update skipped.')
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                failMsg = 'ERROR_DOWNLOAD_MANIFEST';
                this.log('ERROR_DOWNLOAD_MANIFEST')
                break;
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                failMsg = 'ERROR_PARSE_MANIFEST';
                this.log('ERROR_PARSE_MANIFEST')
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log('Already up to date with the latest remote version.');
                this.log('Already up to date with the latest remote version.')
                this._finishCallback(UPDATE_TYPE.LATEST);
                this.reset();
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                //todo 重试
                failMsg = 'UPDATE_FAILED';
                this.log('UPDATE_FAILED');
                this.failMsgNum++;
                console.log('GameUpdate._am.downloadFailedAssets()          failMsgNum    = ', this.failMsgNum);
                this._am.downloadFailedAssets();
                break;
            default:
                break;
        }

        if (failMsg && this.failMsgNum == 3) {
            this.failMsgNum = 0;
            console.log('update callback: ' + failMsg);
            this.log('update callback: ' + failMsg)
            // GameUpdate.showFailDialog(failMsg);
            this._finishCallback(UPDATE_TYPE.ERROR)
            this.reset()
            return;
        }

        if (needRestart) {
            this._am.setEventCallback(null);
            // this._updateListener = null;
            // Prepend the manifest's search path
            let searchPaths = jsb.fileUtils.getSearchPaths();
            let newPaths = this._am.getLocalManifest().getSearchPaths();
            // 插入新的搜索路径
            Array.prototype.unshift.apply(searchPaths, newPaths); // "searchPaths": []中的路径
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            this.log("重启游戏")
            console.log("重启游戏")
            this._finishCallback(UPDATE_TYPE.OVER)
            this.reset();
            // cc.game.restart();
        }
    }

    /**
     * 清空事件回调
     *
     * @memberof UpdateGame
     */
    public reset(): void {
        this._am.setEventCallback(null);
        this._am = null
    }

    public log(str: string) {
        // this.debug && this.debug.setText(str);
    }
    // 自定义md5
    public md5(data) {
        // for test/debug
        function fflog(msg) {
            try {
                console.log(msg);
            } catch (e) { }
        }

        // convert number to (unsigned) 32 bit hex, zero filled string
        function to_zerofilled_hex(n) {
            var t1 = (n >>> 24).toString(16);
            var t2 = (n & 0x00FFFFFF).toString(16);
            return "00".substr(0, 2 - t1.length) + t1 +
                "000000".substr(0, 6 - t2.length) + t2;
        }

        // convert a 64 bit unsigned number to array of bytes. Little endian
        function int64_to_bytes(num) {
            var retval = [];
            for (var i = 0; i < 8; i++) {
                retval.push(num & 0xFF);
                num = num >>> 8;
            }
            return retval;
        }

        //  32 bit left-rotation
        function rol(num, places) {
            return ((num << places) & 0xFFFFFFFF) | (num >>> (32 - places));
        }

        // The 4 MD5 functions
        function fF(b, c, d) {
            return (b & c) | (~b & d);
        }

        function fG(b, c, d) {
            return (d & b) | (~d & c);
        }

        function fH(b, c, d) {
            return b ^ c ^ d;
        }

        function fI(b, c, d) {
            return c ^ (b | ~d);
        }

        // pick 4 bytes at specified offset. Little-endian is assumed
        function bytes_to_int32(arr, off) {
            return (arr[off + 3] << 24) | (arr[off + 2] << 16) | (arr[off + 1] << 8) | (arr[off]);
        }
        // convert the 4 32-bit buffers to a 128 bit hex string. (Little-endian is assumed)
        function int128le_to_hex(a, b, c, d) {
            var ra = "";
            var t = 0;
            var ta = 0;
            for (var i = 3; i >= 0; i--) {
                ta = arguments[i];
                t = (ta & 0xFF);
                ta = ta >>> 8;
                t = t << 8;
                t = t | (ta & 0xFF);
                ta = ta >>> 8;
                t = t << 8;
                t = t | (ta & 0xFF);
                ta = ta >>> 8;
                t = t << 8;
                t = t | ta;
                ra = ra + to_zerofilled_hex(t);
            }
            return ra;
        }

        // check input data type and perform conversions if needed

        // if (!data instanceof Uint8Array) {
        //     fflog("input data type mismatch only support Uint8Array");
        //     return null;
        // }
        var databytes = [];
        for (var i = 0; i < data.byteLength; i++) {
            databytes.push(data[i]);
        }

        // save original length
        var org_len = databytes.length;

        // first append the "1" + 7x "0"
        databytes.push(0x80);

        // determine required amount of padding
        var tail = databytes.length % 64;
        // no room for msg length?
        if (tail > 56) {
            // pad to next 512 bit block
            for (var i = 0; i < (64 - tail); i++) {
                databytes.push(0x0);
            }
            tail = databytes.length % 64;
        }
        for (i = 0; i < (56 - tail); i++) {
            databytes.push(0x0);
        }
        // message length in bits mod 512 should now be 448
        // append 64 bit, little-endian original msg length (in *bits*!)
        databytes = databytes.concat(int64_to_bytes(org_len * 8));

        // initialize 4x32 bit state
        var h0 = 0x67452301;
        var h1 = 0xEFCDAB89;
        var h2 = 0x98BADCFE;
        var h3 = 0x10325476;

        // temp buffers
        var a = 0,
            b = 0,
            c = 0,
            d = 0;


        function _add(n1, n2) {
            return 0x0FFFFFFFF & (n1 + n2)
        }

        // function update partial state for each run
        var updateRun = function (nf, sin32, dw32, b32) {
            var temp = d;
            d = c;
            c = b;
            //b = b + rol(a + (nf + (sin32 + dw32)), b32);
            b = _add(b,
                rol(
                    _add(a,
                        _add(nf, _add(sin32, dw32))
                    ), b32
                )
            );
            a = temp;
        };


        // Digest message
        for (i = 0; i < databytes.length / 64; i++) {
            // initialize run
            a = h0;
            b = h1;
            c = h2;
            d = h3;

            var ptr = i * 64;

            // do 64 runs
            updateRun(fF(b, c, d), 0xd76aa478, bytes_to_int32(databytes, ptr), 7);
            updateRun(fF(b, c, d), 0xe8c7b756, bytes_to_int32(databytes, ptr + 4), 12);
            updateRun(fF(b, c, d), 0x242070db, bytes_to_int32(databytes, ptr + 8), 17);
            updateRun(fF(b, c, d), 0xc1bdceee, bytes_to_int32(databytes, ptr + 12), 22);
            updateRun(fF(b, c, d), 0xf57c0faf, bytes_to_int32(databytes, ptr + 16), 7);
            updateRun(fF(b, c, d), 0x4787c62a, bytes_to_int32(databytes, ptr + 20), 12);
            updateRun(fF(b, c, d), 0xa8304613, bytes_to_int32(databytes, ptr + 24), 17);
            updateRun(fF(b, c, d), 0xfd469501, bytes_to_int32(databytes, ptr + 28), 22);
            updateRun(fF(b, c, d), 0x698098d8, bytes_to_int32(databytes, ptr + 32), 7);
            updateRun(fF(b, c, d), 0x8b44f7af, bytes_to_int32(databytes, ptr + 36), 12);
            updateRun(fF(b, c, d), 0xffff5bb1, bytes_to_int32(databytes, ptr + 40), 17);
            updateRun(fF(b, c, d), 0x895cd7be, bytes_to_int32(databytes, ptr + 44), 22);
            updateRun(fF(b, c, d), 0x6b901122, bytes_to_int32(databytes, ptr + 48), 7);
            updateRun(fF(b, c, d), 0xfd987193, bytes_to_int32(databytes, ptr + 52), 12);
            updateRun(fF(b, c, d), 0xa679438e, bytes_to_int32(databytes, ptr + 56), 17);
            updateRun(fF(b, c, d), 0x49b40821, bytes_to_int32(databytes, ptr + 60), 22);
            updateRun(fG(b, c, d), 0xf61e2562, bytes_to_int32(databytes, ptr + 4), 5);
            updateRun(fG(b, c, d), 0xc040b340, bytes_to_int32(databytes, ptr + 24), 9);
            updateRun(fG(b, c, d), 0x265e5a51, bytes_to_int32(databytes, ptr + 44), 14);
            updateRun(fG(b, c, d), 0xe9b6c7aa, bytes_to_int32(databytes, ptr), 20);
            updateRun(fG(b, c, d), 0xd62f105d, bytes_to_int32(databytes, ptr + 20), 5);
            updateRun(fG(b, c, d), 0x2441453, bytes_to_int32(databytes, ptr + 40), 9);
            updateRun(fG(b, c, d), 0xd8a1e681, bytes_to_int32(databytes, ptr + 60), 14);
            updateRun(fG(b, c, d), 0xe7d3fbc8, bytes_to_int32(databytes, ptr + 16), 20);
            updateRun(fG(b, c, d), 0x21e1cde6, bytes_to_int32(databytes, ptr + 36), 5);
            updateRun(fG(b, c, d), 0xc33707d6, bytes_to_int32(databytes, ptr + 56), 9);
            updateRun(fG(b, c, d), 0xf4d50d87, bytes_to_int32(databytes, ptr + 12), 14);
            updateRun(fG(b, c, d), 0x455a14ed, bytes_to_int32(databytes, ptr + 32), 20);
            updateRun(fG(b, c, d), 0xa9e3e905, bytes_to_int32(databytes, ptr + 52), 5);
            updateRun(fG(b, c, d), 0xfcefa3f8, bytes_to_int32(databytes, ptr + 8), 9);
            updateRun(fG(b, c, d), 0x676f02d9, bytes_to_int32(databytes, ptr + 28), 14);
            updateRun(fG(b, c, d), 0x8d2a4c8a, bytes_to_int32(databytes, ptr + 48), 20);
            updateRun(fH(b, c, d), 0xfffa3942, bytes_to_int32(databytes, ptr + 20), 4);
            updateRun(fH(b, c, d), 0x8771f681, bytes_to_int32(databytes, ptr + 32), 11);
            updateRun(fH(b, c, d), 0x6d9d6122, bytes_to_int32(databytes, ptr + 44), 16);
            updateRun(fH(b, c, d), 0xfde5380c, bytes_to_int32(databytes, ptr + 56), 23);
            updateRun(fH(b, c, d), 0xa4beea44, bytes_to_int32(databytes, ptr + 4), 4);
            updateRun(fH(b, c, d), 0x4bdecfa9, bytes_to_int32(databytes, ptr + 16), 11);
            updateRun(fH(b, c, d), 0xf6bb4b60, bytes_to_int32(databytes, ptr + 28), 16);
            updateRun(fH(b, c, d), 0xbebfbc70, bytes_to_int32(databytes, ptr + 40), 23);
            updateRun(fH(b, c, d), 0x289b7ec6, bytes_to_int32(databytes, ptr + 52), 4);
            updateRun(fH(b, c, d), 0xeaa127fa, bytes_to_int32(databytes, ptr), 11);
            updateRun(fH(b, c, d), 0xd4ef3085, bytes_to_int32(databytes, ptr + 12), 16);
            updateRun(fH(b, c, d), 0x4881d05, bytes_to_int32(databytes, ptr + 24), 23);
            updateRun(fH(b, c, d), 0xd9d4d039, bytes_to_int32(databytes, ptr + 36), 4);
            updateRun(fH(b, c, d), 0xe6db99e5, bytes_to_int32(databytes, ptr + 48), 11);
            updateRun(fH(b, c, d), 0x1fa27cf8, bytes_to_int32(databytes, ptr + 60), 16);
            updateRun(fH(b, c, d), 0xc4ac5665, bytes_to_int32(databytes, ptr + 8), 23);
            updateRun(fI(b, c, d), 0xf4292244, bytes_to_int32(databytes, ptr), 6);
            updateRun(fI(b, c, d), 0x432aff97, bytes_to_int32(databytes, ptr + 28), 10);
            updateRun(fI(b, c, d), 0xab9423a7, bytes_to_int32(databytes, ptr + 56), 15);
            updateRun(fI(b, c, d), 0xfc93a039, bytes_to_int32(databytes, ptr + 20), 21);
            updateRun(fI(b, c, d), 0x655b59c3, bytes_to_int32(databytes, ptr + 48), 6);
            updateRun(fI(b, c, d), 0x8f0ccc92, bytes_to_int32(databytes, ptr + 12), 10);
            updateRun(fI(b, c, d), 0xffeff47d, bytes_to_int32(databytes, ptr + 40), 15);
            updateRun(fI(b, c, d), 0x85845dd1, bytes_to_int32(databytes, ptr + 4), 21);
            updateRun(fI(b, c, d), 0x6fa87e4f, bytes_to_int32(databytes, ptr + 32), 6);
            updateRun(fI(b, c, d), 0xfe2ce6e0, bytes_to_int32(databytes, ptr + 60), 10);
            updateRun(fI(b, c, d), 0xa3014314, bytes_to_int32(databytes, ptr + 24), 15);
            updateRun(fI(b, c, d), 0x4e0811a1, bytes_to_int32(databytes, ptr + 52), 21);
            updateRun(fI(b, c, d), 0xf7537e82, bytes_to_int32(databytes, ptr + 16), 6);
            updateRun(fI(b, c, d), 0xbd3af235, bytes_to_int32(databytes, ptr + 44), 10);
            updateRun(fI(b, c, d), 0x2ad7d2bb, bytes_to_int32(databytes, ptr + 8), 15);
            updateRun(fI(b, c, d), 0xeb86d391, bytes_to_int32(databytes, ptr + 36), 21);

            // update buffers
            h0 = _add(h0, a);
            h1 = _add(h1, b);
            h2 = _add(h2, c);
            h3 = _add(h3, d);
        }
        // Done! Convert buffers to 128 bit (LE)
        return int128le_to_hex(h3, h2, h1, h0).toLowerCase();
    };
}

