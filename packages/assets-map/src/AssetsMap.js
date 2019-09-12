let fs = require('fire-fs');
let path = require('fire-path');
const async = require('async');

const DB_ASSETS = 'db://assets/';
/**
 * ["folder", "texture", "sprite-frame", 
 * "asset", "particle", "prefab", "scene", 
 * "javascript", "animation-clip", "sprite-atlas", 
 * "dragonbones-atlas", "dragonbones", "tiled-map", 
 * "auto-atlas", "audio-clip", "bitmap-font", "ttf-font", 
 * "label-atlas", "spine", "markdown", "text", "json"]
 */

class GroupAssets {
    /**
     * 通过assetsInfo找到对应的物理文件
     * @param {*} item 
     * @param {*} buildAssets 
     * @param {*} array 
     */
    getNativePath(item, buildAssets, array) {
        let object = buildAssets[item.uuid];
        if (!object) {
            return;
        }
        let url = item.url;
        let nativePath = object.nativePath;
        // console.log('jsw OBJECT', JSON.stringify(object))
        if (nativePath) {
            nativePath = nativePath.replace(/\\/g, '/');
            array.push({ nativePath, url });
        } else if (object.dependUuids) {
            object.dependUuids.forEach(uuid => this.getNativePath({ url, uuid }, buildAssets, array));
        }
    }

    /**
     * 查找图片资源对应的构建文件
     * @param {*} assetsInfos 
     * @param {*} buildAssets 
     */
    getAssetFiles(assetsInfos, buildAssets) {
        let array = [];
        assetsInfos.forEach(item => {
            this.getNativePath(item, buildAssets, array);
        })
        return array;
    }

    groupAssets(array) {
        this.groupFiles = array;
        // return;
        //不进行分组，由使用者自己解析，这样灵活性更强

        let object = {};
        array.map(item => {
            // console.log('jsw', SON.stringify(item));
            let pathArray = item.url.split('/');
            let moduleName = pathArray[0];
            // Editor.log(moduleName + "==" + item.url);
            // Editor.log(moduleName + "jsw " + JSON.stringify(item));
            //如果在resources目录，放入对应子目录
            if (moduleName === 'resources') {
                moduleName = 'resources';
            }
            let files = object[moduleName];

            if (!files) {
                files = [];
                object[moduleName] = files;
            }

            if (!files.includes(item.nativePath)) {
                files.push(item.nativePath);
                // res/import JSON 文件
                files.push(this.getAssetsJson(item.nativePath)) // json 对应文件也放进去
            }
        })
        // console.log(JSON.stringify(object, null, 4));
        this.groupFiles = object;
    }

    /**
     * 获取到资源对应的json
     * @param {*} nativePath 
     */
    getAssetsJson(nativePath) {
        let json_path = nativePath.split('/');
        json_path[1] = 'import';
        json_path = json_path.join('/');
        json_path = json_path.split('.');
        json_path[1] = 'json'
        json_path = json_path.join('.')
        return json_path;
    }

    /**
     * 保存到文件
     * @param {*} fileName 
     */
    saveToFile(fileName) {
        Editor.log(fileName);
        let str = this.getGroupFiles();
        if (str) {
            fs.writeFileSync(fileName, str, 'utf8');
        }
    }

    getGroupFiles() {
        if (!this.groupFiles) {
            Editor.Dialog.messageBox({ type: 'error', message: '数据不存在！' });
            return '';
        }

        let str = JSON.stringify(this.groupFiles, null, 4);
        return str;
    }

    findAssets(options, cb) {
        //分析图片文件
        if (!options) {
            Editor.Dialog.messageBox({ type: 'error', message: '请构建后执行此操作！' });
            return;
        }
        let buildResults = options.buildResults;
        let tasks = [
            'sprite-frame',
            'audio-clip',
            'sprite-atlas',
            'tiled-map',
            'dragonbones-atlas',
            'dragonbones',
            'spine',
            'asset',
            'label-atlas',
            'bitmap-font',
            'ttf-font',
            'json',
            // 'scene'
        ];
        async.mapSeries(tasks, (item, cb) => { // 依次执行 tasks 数组
            let str = "db://**/*";
            Editor.assetdb.queryAssets(str, item, (err, assetsInfos) => { // cocos api 查询资源
                let items = this.getAssetFiles(assetsInfos, buildResults._buildAssets).concat();
                cb(null, items);
            });
        }, (err, array) => {
            //去掉前缀路径
            let buildTemplate = path.basename(options.dest);
            let root = path.join(options.buildPath, buildTemplate).replace(/\\/g, '/');
            Editor.log(`构建资源目录：${root}`);
            let length = root.length + 1;
            let data = [];
            array.forEach(items => {
                items.forEach(item => {
                    item.nativePath = item.nativePath.substr(length);
                    Editor.log(item.nativePath);
                    if (item.url.startsWith('db://internal')) {
                        item.url = item.url.substr('db://'.length);
                    } else {
                        item.url = item.url.substr(DB_ASSETS.length);
                    }

                    data.push(item);
                })
            });
            this.groupAssets(data);

            if (cb) {
                cb();
            }
        })
    }
};

module.exports = GroupAssets;