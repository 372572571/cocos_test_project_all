/**
 * 清单服务
 *
 * @export
 * @class Manifest
 */
export class Manifest {
    // 清单服务地址
    public manifestServiceUrl: string = null;


    /**
    * 尝试从服务器中获取 ArrayBuffer 类型的数据
    *
    * @static
    * @param {string} url
    * @param {(data: ArrayBuffer) => void} call
    * @memberof Http
    */
    public static GetFileByArrayBuffer(url: string) {
        return new Promise((reject, resolve) => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        xhr.responseType = 'arraybuffer';
                        resolve(xhr.response);
                    } else {
                        reject(xhr.response);
                    }
                }
            }
            xhr.open("GET", url, true);
            xhr.send();
        })
    }

    /**
     * 获取模块清单数据,如果没有则返回null
     *
     * @static
     * @param {string} m
     * @param {string} manifest_name
     * @returns {string}
     * @memberof Manifest
     */
    public static getNativeManifest(m: string, manifest_name: string): string {
        let root: string = jsb.fileUtils.getWritablePath();
        if (!jsb.fileUtils.isDirectoryExist(`${root}/${m}`)) {
            jsb.fileUtils.createDirectory(`${root}/${m}`);// 创建目录
        }
        if (jsb.fileUtils.isDirectoryExist(`${root}/${m}/${manifest_name}`)) {
            return jsb.fileUtils.getStringFromFile(`${root}/${m}/${manifest_name}`);
        }
        return null;
    }
}

declare let jsb: any