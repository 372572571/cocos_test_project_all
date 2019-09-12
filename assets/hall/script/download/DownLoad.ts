import { rejects } from "assert";
import { resolve } from "url";

// 下载大文件
export class Downloads {
    private _downloadsUrl: string = null;    // 下载地址。

    private _downloadsDirName: string = null;   // 下载路径 可操作目录相对路径

    private _downloads: any = null; // new jsb.Downloader

    public error: (error: DownLoadError) => void = null;   // 下载出错的回调
    public schedule: (info: DownLoadInfo) => void = null;  // 设置下载进度
    public success: (res: DownLoadSuccess) => void = null // 下载成功回调
    private writePath: string;
    // 开始下载
    public startDownLoad(url: string, dir_name?: string): void {
        if (cc.sys.os !== cc.sys.OS_ANDROID && cc.sys.os !== cc.sys.OS_IOS) {
            return; // 如果不是安卓或ios
        }
        this._downloadsUrl = url;
        // this._downloadsDirName = dir_name;
        this.downloads(this.success);
    }
    /**
     * 下载文件
     *
     * @private
     * @memberof Downloads
     */
    private downloads(call?: (res: DownLoadSuccess) => void) {
        this._downloads = new jsb.Downloader({
            timeoutInSeconds: 1000, // 超时
            countOfMaxProcessingTasks: 1, // 最大任务数量
            tempFileNameSuffix: ".tmp", // 临时文件后缀
        });
        // 下载错误回调设置
        this._downloads.setOnTaskError((task, errorCode, errorCodeInternal, errorStr) => {
            console.log('jsw error downloader 失败');
            if (this.error) {
                this.error({ task: task, errorCode: errorCode, errorCodeInternal: errorCodeInternal, errorStr: errorStr });
            }
        });
        // 下载进度回调
        this._downloads.setOnTaskProgress((task, bytesReceived, totalBytesReceived, totalBytesExpected) => {
            if (this.schedule) {
                this.schedule({ task: task, bytesReceived: bytesReceived, totalBytesReceived: totalBytesReceived, totalBytesExpected: totalBytesExpected });
            }
        });
        // 下载成功
        this._downloads.setOnFileTaskSuccess(() => {
            if (call) {
                call({ path: this.writePath });
            }
        });
        console.log('jsw path = 写入路径 = ', jsb.fileUtils.getWritablePath());
        console.log('jsw url = 下载地址 = ', this._downloadsUrl);
        this.writePath = jsb.fileUtils.getWritablePath() + this._downloadsUrl.split('/').pop();
        this._downloads.createDownloadFileTask(this._downloadsUrl,
            this.writePath); // 开始任务
    }
}

// 下载失败信息
export interface DownLoadError {
    task: any
    errorCode: number
    errorCodeInternal: any
    errorStr: string
}
// 加载进度信息
export interface DownLoadInfo {
    task: any
    bytesReceived: number
    totalBytesReceived: number
    totalBytesExpected: number
}
// 成功后返回路径
export interface DownLoadSuccess {
    path: string
}

export class DownloadsPromise {
    private _downloadsUrl: string = null;    // 下载地址。

    private _downloadsFileName: string = null;   // 下载路径 可操作目录相对路径

    private _downloads: any = null; // new jsb.Downloader

    public error: (error: DownLoadError) => void = null;   // 下载出错的回调
    public schedule: (info: DownLoadInfo) => void = null;  // 设置下载进度
    public success: (res: DownLoadSuccess) => void = null // 下载成功回调
    private writePath: string;
    // 开始下载
    public startDownLoad(url: string, file_name?: string): Promise<{}> {
        return new Promise((resolve, rejects) => {
            this._downloadsUrl = url;
            this._downloadsFileName = file_name;
            this.downloads().then((res) => {
                // console.log('startDownLoad')
                resolve(res)
            }).catch((err) => {
                // console.log('startDownLoad')
                rejects(err)
            })
        })


    }
    /**
     * 下载文件
     *
     * @private
     * @memberof Downloads
     */
    private downloads(): Promise<{}> {
        return new Promise((resolve, rejects) => {
            this._downloads = new jsb.Downloader({
                timeoutInSeconds: 1000, // 超时
                countOfMaxProcessingTasks: 1, // 最大任务数量
                tempFileNameSuffix: ".tmp", // 临时文件后缀
            });
            // 下载错误回调设置
            this._downloads.setOnTaskError((task, errorCode, errorCodeInternal, errorStr) => {
                console.log('jsw error downloader 失败');
                if (this.error) {
                    this.error({ task: task, errorCode: errorCode, errorCodeInternal: errorCodeInternal, errorStr: errorStr });
                }
                rejects({ task: task, errorCode: errorCode, errorCodeInternal: errorCodeInternal, errorStr: errorStr })
            });
            // 下载进度回调
            this._downloads.setOnTaskProgress((task, bytesReceived, totalBytesReceived, totalBytesExpected) => {
                if (this.schedule) {
                    this.schedule({ task: task, bytesReceived: bytesReceived, totalBytesReceived: totalBytesReceived, totalBytesExpected: totalBytesExpected });
                }
            });
            // 下载成功
            this._downloads.setOnFileTaskSuccess(() => {
                resolve({ path: this.writePath });
            });
            console.log('jsw path = 写入路径 = ', jsb.fileUtils.getWritablePath());
            console.log('jsw url = 下载地址 = ', this._downloadsUrl);

            if (this._downloadsFileName) { // 文件名称
                this.writePath = jsb.fileUtils.getWritablePath() + this._downloadsFileName;
            } else {
                this.writePath = jsb.fileUtils.getWritablePath() + this._downloadsUrl.split('/').pop();
            }
            this._downloads.createDownloadFileTask(this._downloadsUrl,
                this.writePath); // 开始任务
        })
    }
}