window.__require = function t(e, s, o) {
function a(i, r) {
if (!s[i]) {
if (!e[i]) {
var l = i.split("/");
l = l[l.length - 1];
if (!e[l]) {
var c = "function" == typeof __require && __require;
if (!r && c) return c(l, !0);
if (n) return n(l, !0);
throw new Error("Cannot find module '" + i + "'");
}
}
var h = s[i] = {
exports: {}
};
e[i][0].call(h.exports, function(t) {
return a(e[i][1][t] || t);
}, h, h.exports, t, e, s, o);
}
return s[i].exports;
}
for (var n = "function" == typeof __require && __require, i = 0; i < o.length; i++) a(o[i]);
return a;
}({
ChildHotUpdate: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "05e27/dwhNJcqm1/nL2ljnV", "ChildHotUpdate");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o;
(function(t) {
t.LATEST = "latest";
t.ERROR = "error";
t.OVER = "over";
t.NEED_UPDATE = "need_update";
t.READY_TO_UPDATE = "READY_TO_UPDATE";
})(o = s.UPDATE_TYPE || (s.UPDATE_TYPE = {}));
var a = function() {
function t() {
this._packageUrl = null;
this._remoteManifest = "project.manifest";
this._remoteVersion = "version.manifest";
this._storagePath = "";
this._finishCallback = null;
this._manifestUrl = null;
this._hotUpdateIng = !1;
this._updating = !1;
this.failMsgNum = 0;
}
Object.defineProperty(t.prototype, "remoteManifest", {
get: function() {
return this._packageUrl + this._remoteManifest;
},
enumerable: !0,
configurable: !0
});
Object.defineProperty(t.prototype, "remoteVersion", {
get: function() {
return this._packageUrl + this._remoteVersion;
},
enumerable: !0,
configurable: !0
});
t.createEmptyManifest = function(t, e, s) {
return JSON.stringify({
packageUrl: t,
remoteManifestUrl: t + "/" + e,
remoteVersionUrl: t + "/" + s,
version: "0.0.1",
assets: {},
searchPaths: []
});
};
t.prototype.versionCompare = function(t, e) {
for (var s = t.split("."), o = e.split("."), a = 0; a < s.length; ++a) {
var n = Number(s[a]), i = Number(o[a]) || 0;
if (n !== i) return n - i;
}
return o.length > s.length ? -1 : 0;
};
t.prototype.verifyCallback = function(t, e) {
var s = this.FileToMd5(t), o = e.md5 == s;
console.log("jsw:", e.md5, s);
if (new RegExp("(project.manifest){1}$").test(t)) {
console.log("过滤神坑md5");
return !0;
}
if (o) console.log("文件校验成功"); else {
console.log("文件校验失败");
jsb.fileUtils.isFileExist(t) && jsb.fileUtils.removeFile(t);
}
return o;
};
t.prototype.FileToMd5 = function(t) {
var e = jsb.fileUtils.getDataFromFile(t);
console.log("jsw:文件类型", typeof e);
return this.md5(e);
};
t.prototype.FindUpdate = function(t) {
var e = this;
return new Promise(function(s, a) {
if (cc.sys.isNative) {
e._packageUrl = t.url;
e._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "" + t.storagePath;
e._manifestUrl = t.path;
e._am = new jsb.AssetsManager(e._packageUrl, e._storagePath, e.versionCompare.bind(e));
if (e._am.getState() === jsb.AssetsManager.State.UNINITED) {
console.log("jsw Run find loadLocalManifest");
e._am.loadLocalManifest(e._manifestUrl);
}
if (e._am.getLocalManifest() && e._am.getLocalManifest().isLoaded()) {
e._am.setEventCallback(function(t) {
switch (t.getEventCode()) {
case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
console.log("No local manifest file found.");
a(o.ERROR);
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
console.log("Fail to download manifest file!");
a(o.ERROR);
break;

case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
console.log("Fail PARSE manifest file.");
a(o.ERROR);
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
console.log("call - Already up to date with the latest remote version.");
s(o.LATEST);
break;

case jsb.EventAssetsManager.NEW_VERSION_FOUND:
console.log("New version found, please try to update.");
s(o.NEED_UPDATE);
break;

case jsb.EventAssetsManager.READY_TO_UPDATE:
console.log("jsw update  准备更新 jsb.EventAssetsManager.READY_TO_UPDATE");
}
e.reset();
});
e._am.checkUpdate();
} else {
console.log("Failed to load local manifest ...");
a(o.ERROR);
e.reset();
}
}
});
};
t.prototype.Run = function(t, e) {
if (cc.sys.isNative) {
console.log("jsw Run update");
console.log("jsw customManifestStr", t.customManifestStr);
this._packageUrl = t.url;
this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "" + t.storagePath;
this._manifestUrl = t.customManifestStr;
this._finishCallback = e;
this._am = new jsb.AssetsManager("" + this._packageUrl, this._storagePath, this.versionCompare.bind(this));
this._am.setVerifyCallback(this.verifyCallback.bind(this));
cc.sys.os === cc.sys.OS_ANDROID && this._am.setMaxConcurrentTask(2);
if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
console.log("jsw Run update loadLocalManifest");
this._am.loadLocalManifest(this._manifestUrl);
}
console.log("jsw Run update loadLocalManifest over");
if (this._am.getLocalManifest() && this._am.getLocalManifest().isLoaded()) {
this._am.setEventCallback(this.checkCb.bind(this));
this._am.checkUpdate();
this._updating = !0;
this._hotUpdateIng = !1;
} else {
console.log("Failed to load local manifest ...");
this._finishCallback(o.ERROR);
this.reset();
}
}
};
t.prototype.checkCb = function(t) {
var e;
switch (t.getEventCode()) {
case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
e = "No local manifest file found.";
console.log("No local manifest file found.");
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
e = "Fail to download manifest file!";
console.log("Fail to download manifest file!");
break;

case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
e = "Fail PARSE manifest file.";
console.log("Fail PARSE manifest file.");
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
console.log("Already up to date with the latest remote version.");
this._finishCallback(o.LATEST);
this.reset();
break;

case jsb.EventAssetsManager.NEW_VERSION_FOUND:
console.log("New version found, please try to update.");
this.hotUpdate();
break;

case jsb.EventAssetsManager.READY_TO_UPDATE:
}
e && console.log("check callback: " + e);
};
t.prototype.hotUpdate = function() {
if (!this._hotUpdateIng) {
this._updating = !0;
console.log("hotUpdate");
if (this._am) {
console.log("hotUpdateRun!");
this._hotUpdateIng = !0;
this._am.setEventCallback(this.updateCb.bind(this));
if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
this._am.loadLocalManifest(this._manifestUrl.customManifestStr);
console.log("hotUpdate 加载清单");
}
this._am.update();
}
}
};
t.prototype.updateCb = function(t) {
var e, s = !1;
switch (t.getEventCode()) {
case jsb.EventAssetsManager.UPDATE_PROGRESSION:
break;

case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
e = "No local manifest file found, hot update skipped.";
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
e = "ERROR_DOWNLOAD_MANIFEST";
break;

case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
e = "ERROR_PARSE_MANIFEST";
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
console.log("Already up to date with the latest remote version.");
this._finishCallback(o.LATEST);
this.reset();
break;

case jsb.EventAssetsManager.UPDATE_FINISHED:
s = !0;
break;

case jsb.EventAssetsManager.UPDATE_FAILED:
e = "UPDATE_FAILED";
this.failMsgNum++;
console.log("GameUpdate._am.downloadFailedAssets()          failMsgNum    = ", this.failMsgNum);
this._am.downloadFailedAssets();
}
if (e && 3 == this.failMsgNum) {
this.failMsgNum = 0;
console.log("update callback: " + e);
this._finishCallback(o.ERROR);
this.reset();
} else if (s) {
this._am.setEventCallback(null);
var a = jsb.fileUtils.getSearchPaths(), n = this._am.getLocalManifest().getSearchPaths();
Array.prototype.unshift.apply(a, n);
cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify(a));
jsb.fileUtils.setSearchPaths(a);
cc.audioEngine.stopAll();
console.log("重启游戏");
this._finishCallback(o.OVER);
this.reset();
}
};
t.prototype.reset = function() {
this._am.setEventCallback(null);
this._am = null;
};
t.prototype.md5 = function(t) {
function e(t) {
var e = (t >>> 24).toString(16), s = (16777215 & t).toString(16);
return "00".substr(0, 2 - e.length) + e + "000000".substr(0, 6 - s.length) + s;
}
function s(t, e) {
return t << e & 4294967295 | t >>> 32 - e;
}
function o(t, e, s) {
return t & e | ~t & s;
}
function a(t, e, s) {
return s & t | ~s & e;
}
function n(t, e, s) {
return t ^ e ^ s;
}
function i(t, e, s) {
return e ^ (t | ~s);
}
function r(t, e) {
return t[e + 3] << 24 | t[e + 2] << 16 | t[e + 1] << 8 | t[e];
}
for (var l = [], c = 0; c < t.byteLength; c++) l.push(t[c]);
var h = l.length;
l.push(128);
var p = l.length % 64;
if (p > 56) {
for (c = 0; c < 64 - p; c++) l.push(0);
p = l.length % 64;
}
for (c = 0; c < 56 - p; c++) l.push(0);
l = l.concat(function(t) {
for (var e = [], s = 0; s < 8; s++) {
e.push(255 & t);
t >>>= 8;
}
return e;
}(8 * h));
var u = 1732584193, f = 4023233417, d = 2562383102, _ = 271733878, g = 0, m = 0, E = 0, b = 0;
function v(t, e) {
return 4294967295 & t + e;
}
var y = function(t, e, o, a) {
var n = b;
b = E;
E = m;
m = v(m, s(v(g, v(t, v(e, o))), a));
g = n;
};
for (c = 0; c < l.length / 64; c++) {
g = u;
var R = 64 * c;
y(o(m = f, E = d, b = _), 3614090360, r(l, R), 7);
y(o(m, E, b), 3905402710, r(l, R + 4), 12);
y(o(m, E, b), 606105819, r(l, R + 8), 17);
y(o(m, E, b), 3250441966, r(l, R + 12), 22);
y(o(m, E, b), 4118548399, r(l, R + 16), 7);
y(o(m, E, b), 1200080426, r(l, R + 20), 12);
y(o(m, E, b), 2821735955, r(l, R + 24), 17);
y(o(m, E, b), 4249261313, r(l, R + 28), 22);
y(o(m, E, b), 1770035416, r(l, R + 32), 7);
y(o(m, E, b), 2336552879, r(l, R + 36), 12);
y(o(m, E, b), 4294925233, r(l, R + 40), 17);
y(o(m, E, b), 2304563134, r(l, R + 44), 22);
y(o(m, E, b), 1804603682, r(l, R + 48), 7);
y(o(m, E, b), 4254626195, r(l, R + 52), 12);
y(o(m, E, b), 2792965006, r(l, R + 56), 17);
y(o(m, E, b), 1236535329, r(l, R + 60), 22);
y(a(m, E, b), 4129170786, r(l, R + 4), 5);
y(a(m, E, b), 3225465664, r(l, R + 24), 9);
y(a(m, E, b), 643717713, r(l, R + 44), 14);
y(a(m, E, b), 3921069994, r(l, R), 20);
y(a(m, E, b), 3593408605, r(l, R + 20), 5);
y(a(m, E, b), 38016083, r(l, R + 40), 9);
y(a(m, E, b), 3634488961, r(l, R + 60), 14);
y(a(m, E, b), 3889429448, r(l, R + 16), 20);
y(a(m, E, b), 568446438, r(l, R + 36), 5);
y(a(m, E, b), 3275163606, r(l, R + 56), 9);
y(a(m, E, b), 4107603335, r(l, R + 12), 14);
y(a(m, E, b), 1163531501, r(l, R + 32), 20);
y(a(m, E, b), 2850285829, r(l, R + 52), 5);
y(a(m, E, b), 4243563512, r(l, R + 8), 9);
y(a(m, E, b), 1735328473, r(l, R + 28), 14);
y(a(m, E, b), 2368359562, r(l, R + 48), 20);
y(n(m, E, b), 4294588738, r(l, R + 20), 4);
y(n(m, E, b), 2272392833, r(l, R + 32), 11);
y(n(m, E, b), 1839030562, r(l, R + 44), 16);
y(n(m, E, b), 4259657740, r(l, R + 56), 23);
y(n(m, E, b), 2763975236, r(l, R + 4), 4);
y(n(m, E, b), 1272893353, r(l, R + 16), 11);
y(n(m, E, b), 4139469664, r(l, R + 28), 16);
y(n(m, E, b), 3200236656, r(l, R + 40), 23);
y(n(m, E, b), 681279174, r(l, R + 52), 4);
y(n(m, E, b), 3936430074, r(l, R), 11);
y(n(m, E, b), 3572445317, r(l, R + 12), 16);
y(n(m, E, b), 76029189, r(l, R + 24), 23);
y(n(m, E, b), 3654602809, r(l, R + 36), 4);
y(n(m, E, b), 3873151461, r(l, R + 48), 11);
y(n(m, E, b), 530742520, r(l, R + 60), 16);
y(n(m, E, b), 3299628645, r(l, R + 8), 23);
y(i(m, E, b), 4096336452, r(l, R), 6);
y(i(m, E, b), 1126891415, r(l, R + 28), 10);
y(i(m, E, b), 2878612391, r(l, R + 56), 15);
y(i(m, E, b), 4237533241, r(l, R + 20), 21);
y(i(m, E, b), 1700485571, r(l, R + 48), 6);
y(i(m, E, b), 2399980690, r(l, R + 12), 10);
y(i(m, E, b), 4293915773, r(l, R + 40), 15);
y(i(m, E, b), 2240044497, r(l, R + 4), 21);
y(i(m, E, b), 1873313359, r(l, R + 32), 6);
y(i(m, E, b), 4264355552, r(l, R + 60), 10);
y(i(m, E, b), 2734768916, r(l, R + 24), 15);
y(i(m, E, b), 1309151649, r(l, R + 52), 21);
y(i(m, E, b), 4149444226, r(l, R + 16), 6);
y(i(m, E, b), 3174756917, r(l, R + 44), 10);
y(i(m, E, b), 718787259, r(l, R + 8), 15);
y(i(m, E, b), 3951481745, r(l, R + 36), 21);
u = v(u, g);
f = v(f, m);
d = v(d, E);
_ = v(_, b);
}
return function(t, s, o, a) {
for (var n = "", i = 0, r = 0, l = 3; l >= 0; l--) {
i = 255 & (r = arguments[l]);
i <<= 8;
i |= 255 & (r >>>= 8);
i <<= 8;
i |= 255 & (r >>>= 8);
i <<= 8;
n += e(i |= r >>>= 8);
}
return n;
}(_, d, f, u).toLowerCase();
};
return t;
}();
s.ChildHotUpdate = a;
cc._RF.pop();
}, {} ],
Demo: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "1b926UopiJEE6iruqqdfVyO", "Demo");
cc._RF.pop();
}, {} ],
DownLoad: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "f04c7DbPf5C34SQ6oIe0jxb", "DownLoad");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = function() {
function t() {
this._downloadsUrl = null;
this._downloadsDirName = null;
this._downloads = null;
this.error = null;
this.schedule = null;
this.success = null;
}
t.prototype.startDownLoad = function(t, e) {
if (cc.sys.os === cc.sys.OS_ANDROID || cc.sys.os === cc.sys.OS_IOS) {
this._downloadsUrl = t;
this.downloads(this.success);
}
};
t.prototype.downloads = function(t) {
var e = this;
this._downloads = new jsb.Downloader({
timeoutInSeconds: 1e3,
countOfMaxProcessingTasks: 1,
tempFileNameSuffix: ".tmp"
});
this._downloads.setOnTaskError(function(t, s, o, a) {
console.log("jsw error downloader 失败");
e.error && e.error({
task: t,
errorCode: s,
errorCodeInternal: o,
errorStr: a
});
});
this._downloads.setOnTaskProgress(function(t, s, o, a) {
e.schedule && e.schedule({
task: t,
bytesReceived: s,
totalBytesReceived: o,
totalBytesExpected: a
});
});
this._downloads.setOnFileTaskSuccess(function() {
t && t({
path: e.writePath
});
});
console.log("jsw path = 写入路径 = ", jsb.fileUtils.getWritablePath());
console.log("jsw url = 下载地址 = ", this._downloadsUrl);
this.writePath = jsb.fileUtils.getWritablePath() + this._downloadsUrl.split("/").pop();
this._downloads.createDownloadFileTask(this._downloadsUrl, this.writePath);
};
return t;
}();
s.Downloads = o;
var a = function() {
function t() {
this._downloadsUrl = null;
this._downloadsFileName = null;
this._downloads = null;
this.error = null;
this.schedule = null;
this.success = null;
}
t.prototype.startDownLoad = function(t, e) {
var s = this;
return new Promise(function(o, a) {
s._downloadsUrl = t;
s._downloadsFileName = e;
s.downloads().then(function(t) {
o(t);
}).catch(function(t) {
a(t);
});
});
};
t.prototype.downloads = function() {
var t = this;
return new Promise(function(e, s) {
t._downloads = new jsb.Downloader({
timeoutInSeconds: 1e3,
countOfMaxProcessingTasks: 1,
tempFileNameSuffix: ".tmp"
});
t._downloads.setOnTaskError(function(e, o, a, n) {
console.log("jsw error downloader 失败");
t.error && t.error({
task: e,
errorCode: o,
errorCodeInternal: a,
errorStr: n
});
s({
task: e,
errorCode: o,
errorCodeInternal: a,
errorStr: n
});
});
t._downloads.setOnTaskProgress(function(e, s, o, a) {
t.schedule && t.schedule({
task: e,
bytesReceived: s,
totalBytesReceived: o,
totalBytesExpected: a
});
});
t._downloads.setOnFileTaskSuccess(function() {
e({
path: t.writePath
});
});
console.log("jsw path = 写入路径 = ", jsb.fileUtils.getWritablePath());
console.log("jsw url = 下载地址 = ", t._downloadsUrl);
t._downloadsFileName ? t.writePath = jsb.fileUtils.getWritablePath() + t._downloadsFileName : t.writePath = jsb.fileUtils.getWritablePath() + t._downloadsUrl.split("/").pop();
t._downloads.createDownloadFileTask(t._downloadsUrl, t.writePath);
});
};
return t;
}();
s.DownloadsPromise = a;
cc._RF.pop();
}, {} ],
GameIcon: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "4f786+Nu9hGSqrRUTsEb/cT", "GameIcon");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o, a = t("../../script/download/DownLoad"), n = t("../../script/download/ChildHotUpdate"), i = t("../../../start/script/config/HotUpdateConfig");
(function(t) {
t[t.NOT = 0] = "NOT";
t[t.READY = 1] = "READY";
t[t.UPDATE = 2] = "UPDATE";
t[t.CHECK_UPDATE = 3] = "CHECK_UPDATE";
t[t.ERROR = 4] = "ERROR";
})(o = s.GAME_TYPE || (s.GAME_TYPE = {}));
var r = cc._decorator, l = r.ccclass, c = r.property, h = function(t) {
__extends(e, t);
function e() {
var e = null !== t && t.apply(this, arguments) || this;
e.gameName = null;
e.type = null;
e.flag = "";
e._progressBar = null;
e._type = 3;
e._childHotUpdate_lock = !1;
e._root_path = "";
return e;
}
e.prototype.onLoad = function() {
var t = this;
this.gameName.string = this.flag;
this.childHotUpdate = new n.ChildHotUpdate();
this._root_path = jsb.fileUtils.getWritablePath();
this.getGameType();
this.upType();
this._type !== o.NOT && this.checkUpdate().then(function(e) {
console.log("jsw 更新检测完成 code = ", e);
t.upType();
}).catch(function(e) {
console.log("jsw 更新检测异常 ", e);
t._type = o.ERROR;
t.upType();
});
};
e.prototype.checkUpdate = function() {
return __awaiter(this, void 0, Promise, function() {
var t, e = this;
return __generator(this, function(s) {
switch (s.label) {
case 0:
return [ 4, this.childHotUpdate.FindUpdate({
url: i.HotUpdateConfig.HotUpdateUrl,
storagePath: "" + this.flag,
path: this._root_path + "project.manifest"
}) ];

case 1:
t = s.sent();
return [ 2, new Promise(function(s, a) {
switch (t) {
case n.UPDATE_TYPE.LATEST:
e._type = o.READY;
break;

case n.UPDATE_TYPE.NEED_UPDATE:
e._type = o.UPDATE;
}
e.upType();
s(t);
}) ];
}
});
});
};
e.prototype.hotUpdate = function() {
var t = this;
this._childHotUpdate_lock = !0;
console.log("jsw 开始更新 hotUpdate:", this.flag);
this.childHotUpdate.Run({
url: i.HotUpdateConfig.HotUpdateUrl + this.flag + "/",
storagePath: "" + this.flag,
customManifestStr: "" + this._root_path + this.flag + "/project.manifest"
}, function(e) {
console.log("jsw 热更消息", e);
switch (e) {
case n.UPDATE_TYPE.LATEST:
console.log("jsw 热更消息 已经是最新", e);
t._type = o.READY;
break;

case n.UPDATE_TYPE.OVER:
console.log("jsw 热更消息 更新完毕", e);
t._type = o.READY;
break;

default:
t._type = o.ERROR;
console.log("jsw 热更新失败流程");
}
t.upType();
});
};
e.prototype.upType = function() {
switch (this._type) {
case o.NOT:
this.type.string = "未下载";
break;

case o.READY:
this.type.string = "";
break;

case o.UPDATE:
this.type.string = "更新游戏";
break;

case o.CHECK_UPDATE:
this.type.string = "检查更新";
break;

default:
this.type.string = "游戏异常";
}
};
Object.defineProperty(e.prototype, "MANIFEST_NAME", {
get: function() {
return "project.manifest";
},
enumerable: !0,
configurable: !0
});
Object.defineProperty(e.prototype, "WRITABLE_DIRECTORY", {
get: function() {
return jsb.fileUtils.getWritablePath();
},
enumerable: !0,
configurable: !0
});
Object.defineProperty(e.prototype, "VERSION_NAME", {
get: function() {
return "version.manifest";
},
enumerable: !0,
configurable: !0
});
Object.defineProperty(e.prototype, "progress", {
set: function(t) {
this._progressBar.progress = t;
},
enumerable: !0,
configurable: !0
});
e.prototype.getGameType = function() {
if (!cc.sys.isNative) {
this._type = o.READY;
return this._type;
}
if (!this.isDownloads()) {
this._type = o.NOT;
return this._type;
}
return this._type;
};
e.prototype.downLoadGame = function(t, e) {
var s = this, n = new a.Downloads();
n.error = function() {
e && e(!1);
console.log("jsw downLoadGame 下载失败");
};
n.success = function(t) {
console.log("jsw downLoadGame 下载成功", t.path);
var a = s.unzip(t.path, "" + s.WRITABLE_DIRECTORY);
console.log("jsw 解压结果", a);
if (a) {
s._type = o.CHECK_UPDATE;
s.upType();
e && e(!0);
}
e && e(!1);
};
n.startDownLoad(t + "/" + this.flag + ".zip");
};
e.prototype.isDownloads = function() {
if ("" === this.flag) return !1;
if (!jsb.fileUtils.isDirectoryExist("" + this.WRITABLE_DIRECTORY + this.flag)) return !1;
console.log("jsw 子游戏查找清单", "" + this.WRITABLE_DIRECTORY + this.flag + "/" + this.MANIFEST_NAME);
return !!jsb.fileUtils.isFileExist("" + this.WRITABLE_DIRECTORY + this.flag + "/" + this.MANIFEST_NAME);
};
e.prototype.unzip = function(t, e) {
var s = !1;
jsb.fileUtils.isDirectoryExist(e) || jsb.fileUtils.createDirectory(e);
if (cc.sys.os === cc.sys.OS_ANDROID) {
jsb.zip ? console.log("zip 存在") : console.log("zip 不存在");
s = jsb.zip.unzip(t, e);
}
console.log("jsw 解压完成", s);
return s;
};
__decorate([ c({
type: cc.Label,
displayName: "游戏名称"
}) ], e.prototype, "gameName", void 0);
__decorate([ c({
type: cc.Label,
displayName: "状态"
}) ], e.prototype, "type", void 0);
__decorate([ c({
displayName: "游戏标识符"
}) ], e.prototype, "flag", void 0);
__decorate([ c(cc.ProgressBar) ], e.prototype, "_progressBar", void 0);
return e = __decorate([ l ], e);
}(cc.Component);
s.GameIcon = h;
cc._RF.pop();
}, {
"../../../start/script/config/HotUpdateConfig": "HotUpdateConfig",
"../../script/download/ChildHotUpdate": "ChildHotUpdate",
"../../script/download/DownLoad": "DownLoad"
} ],
HotUpdateConfig: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "38611x4x7NOxp8QIJ9Mhwiz", "HotUpdateConfig");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = function() {
function t() {}
t.HotUpdateUrl = "http://192.168.3.125:8099/static/";
return t;
}();
s.HotUpdateConfig = o;
cc._RF.pop();
}, {} ],
MD5: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "c3379e3qrdGxrNzcN2bRvYa", "MD5");
e.exports = function(t) {
function e(t) {
var e = (t >>> 24).toString(16), s = (16777215 & t).toString(16);
return "00".substr(0, 2 - e.length) + e + "000000".substr(0, 6 - s.length) + s;
}
function s(t, e) {
return t << e & 4294967295 | t >>> 32 - e;
}
function o(t, e, s) {
return t & e | ~t & s;
}
function a(t, e, s) {
return s & t | ~s & e;
}
function n(t, e, s) {
return t ^ e ^ s;
}
function i(t, e, s) {
return e ^ (t | ~s);
}
function r(t, e) {
return t[e + 3] << 24 | t[e + 2] << 16 | t[e + 1] << 8 | t[e];
}
for (var l = [], c = 0; c < t.byteLength; c++) l.push(t[c]);
var h = l.length;
l.push(128);
var p = l.length % 64;
if (p > 56) {
for (c = 0; c < 64 - p; c++) l.push(0);
p = l.length % 64;
}
for (c = 0; c < 56 - p; c++) l.push(0);
l = l.concat(function(t) {
for (var e = [], s = 0; s < 8; s++) {
e.push(255 & t);
t >>>= 8;
}
return e;
}(8 * h));
var u = 1732584193, f = 4023233417, d = 2562383102, _ = 271733878, g = 0, m = 0, E = 0, b = 0;
function v(t, e) {
return 4294967295 & t + e;
}
var y = function(t, e, o, a) {
var n = b;
b = E;
E = m;
m = v(m, s(v(g, v(t, v(e, o))), a));
g = n;
};
for (c = 0; c < l.length / 64; c++) {
g = u;
var R = 64 * c;
y(o(m = f, E = d, b = _), 3614090360, r(l, R), 7);
y(o(m, E, b), 3905402710, r(l, R + 4), 12);
y(o(m, E, b), 606105819, r(l, R + 8), 17);
y(o(m, E, b), 3250441966, r(l, R + 12), 22);
y(o(m, E, b), 4118548399, r(l, R + 16), 7);
y(o(m, E, b), 1200080426, r(l, R + 20), 12);
y(o(m, E, b), 2821735955, r(l, R + 24), 17);
y(o(m, E, b), 4249261313, r(l, R + 28), 22);
y(o(m, E, b), 1770035416, r(l, R + 32), 7);
y(o(m, E, b), 2336552879, r(l, R + 36), 12);
y(o(m, E, b), 4294925233, r(l, R + 40), 17);
y(o(m, E, b), 2304563134, r(l, R + 44), 22);
y(o(m, E, b), 1804603682, r(l, R + 48), 7);
y(o(m, E, b), 4254626195, r(l, R + 52), 12);
y(o(m, E, b), 2792965006, r(l, R + 56), 17);
y(o(m, E, b), 1236535329, r(l, R + 60), 22);
y(a(m, E, b), 4129170786, r(l, R + 4), 5);
y(a(m, E, b), 3225465664, r(l, R + 24), 9);
y(a(m, E, b), 643717713, r(l, R + 44), 14);
y(a(m, E, b), 3921069994, r(l, R), 20);
y(a(m, E, b), 3593408605, r(l, R + 20), 5);
y(a(m, E, b), 38016083, r(l, R + 40), 9);
y(a(m, E, b), 3634488961, r(l, R + 60), 14);
y(a(m, E, b), 3889429448, r(l, R + 16), 20);
y(a(m, E, b), 568446438, r(l, R + 36), 5);
y(a(m, E, b), 3275163606, r(l, R + 56), 9);
y(a(m, E, b), 4107603335, r(l, R + 12), 14);
y(a(m, E, b), 1163531501, r(l, R + 32), 20);
y(a(m, E, b), 2850285829, r(l, R + 52), 5);
y(a(m, E, b), 4243563512, r(l, R + 8), 9);
y(a(m, E, b), 1735328473, r(l, R + 28), 14);
y(a(m, E, b), 2368359562, r(l, R + 48), 20);
y(n(m, E, b), 4294588738, r(l, R + 20), 4);
y(n(m, E, b), 2272392833, r(l, R + 32), 11);
y(n(m, E, b), 1839030562, r(l, R + 44), 16);
y(n(m, E, b), 4259657740, r(l, R + 56), 23);
y(n(m, E, b), 2763975236, r(l, R + 4), 4);
y(n(m, E, b), 1272893353, r(l, R + 16), 11);
y(n(m, E, b), 4139469664, r(l, R + 28), 16);
y(n(m, E, b), 3200236656, r(l, R + 40), 23);
y(n(m, E, b), 681279174, r(l, R + 52), 4);
y(n(m, E, b), 3936430074, r(l, R), 11);
y(n(m, E, b), 3572445317, r(l, R + 12), 16);
y(n(m, E, b), 76029189, r(l, R + 24), 23);
y(n(m, E, b), 3654602809, r(l, R + 36), 4);
y(n(m, E, b), 3873151461, r(l, R + 48), 11);
y(n(m, E, b), 530742520, r(l, R + 60), 16);
y(n(m, E, b), 3299628645, r(l, R + 8), 23);
y(i(m, E, b), 4096336452, r(l, R), 6);
y(i(m, E, b), 1126891415, r(l, R + 28), 10);
y(i(m, E, b), 2878612391, r(l, R + 56), 15);
y(i(m, E, b), 4237533241, r(l, R + 20), 21);
y(i(m, E, b), 1700485571, r(l, R + 48), 6);
y(i(m, E, b), 2399980690, r(l, R + 12), 10);
y(i(m, E, b), 4293915773, r(l, R + 40), 15);
y(i(m, E, b), 2240044497, r(l, R + 4), 21);
y(i(m, E, b), 1873313359, r(l, R + 32), 6);
y(i(m, E, b), 4264355552, r(l, R + 60), 10);
y(i(m, E, b), 2734768916, r(l, R + 24), 15);
y(i(m, E, b), 1309151649, r(l, R + 52), 21);
y(i(m, E, b), 4149444226, r(l, R + 16), 6);
y(i(m, E, b), 3174756917, r(l, R + 44), 10);
y(i(m, E, b), 718787259, r(l, R + 8), 15);
y(i(m, E, b), 3951481745, r(l, R + 36), 21);
u = v(u, g);
f = v(f, m);
d = v(d, E);
_ = v(_, b);
}
return function(t, s, o, a) {
for (var n = "", i = 0, r = 0, l = 3; l >= 0; l--) {
i = 255 & (r = arguments[l]);
i <<= 8;
i |= 255 & (r >>>= 8);
i <<= 8;
i |= 255 & (r >>>= 8);
i <<= 8;
n += e(i |= r >>>= 8);
}
return n;
}(_, d, f, u).toLowerCase();
};
cc._RF.pop();
}, {} ],
Manifest: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "2514eOgeuhL0K09SmSFTAk2", "Manifest");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = function() {
function t() {
this.manifestServiceUrl = null;
}
t.GetFileByArrayBuffer = function(t) {
return new Promise(function(e, s) {
var o = new XMLHttpRequest();
o.onreadystatechange = function() {
if (4 === o.readyState) if (200 === o.status) {
o.responseType = "arraybuffer";
s(o.response);
} else e(o.response);
};
o.open("GET", t, !0);
o.send();
});
};
t.getNativeManifest = function(t, e) {
var s = jsb.fileUtils.getWritablePath();
jsb.fileUtils.isDirectoryExist(s + "/" + t) || jsb.fileUtils.createDirectory(s + "/" + t);
return jsb.fileUtils.isDirectoryExist(s + "/" + t + "/" + e) ? jsb.fileUtils.getStringFromFile(s + "/" + t + "/" + e) : null;
};
return t;
}();
s.Manifest = o;
cc._RF.pop();
}, {} ],
UpdateGame: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "bff518bbABMI6GobCrrEO3J", "UpdateGame");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o;
(function(t) {
t.LATEST = "latest";
t.ERROR = "error";
t.OVER = "over";
})(o = s.UPDATE_TYPE || (s.UPDATE_TYPE = {}));
var a = function() {
function t() {
this._packageUrl = null;
this._remoteManifest = "project.manifest";
this._remoteVersion = "version.manifest";
this._storagePath = "";
this._finishCallback = null;
this._manifestUrl = null;
this._hotUpdateIng = !1;
this._updating = !1;
this.debug = null;
this.failMsgNum = 0;
}
Object.defineProperty(t.prototype, "remoteManifest", {
get: function() {
return this._packageUrl + this._remoteManifest;
},
enumerable: !0,
configurable: !0
});
Object.defineProperty(t.prototype, "remoteVersion", {
get: function() {
return this._packageUrl + this._remoteVersion;
},
enumerable: !0,
configurable: !0
});
t.createEmptyManifest = function(t, e, s) {
return JSON.stringify({
packageUrl: t,
remoteManifestUrl: t + "/" + e,
remoteVersionUrl: t + "/" + s,
version: "0.0.1",
assets: {},
searchPaths: []
});
};
t.prototype.versionCompare = function(t, e) {
this.log("校验版本 A:" + t + " B:" + e);
for (var s = t.split("."), o = e.split("."), a = 0; a < s.length; ++a) {
var n = Number(s[a]), i = Number(o[a]) || 0;
if (n !== i) return n - i;
}
return o.length > s.length ? -1 : 0;
};
t.prototype.verifyCallback = function(t, e) {
var s = this.FileToMd5(t), o = e.md5 == s;
console.log("jsw:", e.md5, s);
if (new RegExp("(project.manifest){1}$").test(t)) {
console.log("过滤神坑md5");
return !0;
}
if (o) console.log("文件校验成功"); else {
console.log("文件校验失败");
jsb.fileUtils.isFileExist(t) && jsb.fileUtils.removeFile(t);
}
return o;
};
t.prototype.FileToMd5 = function(t) {
var e = jsb.fileUtils.getDataFromFile(t);
console.log("jsw:文件类型", typeof e);
return this.md5(e);
};
t.prototype.Run = function(t, e) {
if (cc.sys.isNative) {
console.log("jsw Run update");
console.log("jsw customManifestStr", t.customManifestStr);
this._packageUrl = t.url;
this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "" + t.storagePath;
this._manifestUrl = t.customManifestStr;
this._finishCallback = e;
this._am = new jsb.AssetsManager(this._packageUrl, this._storagePath, this.versionCompare.bind(this));
this._am.setVerifyCallback(this.verifyCallback.bind(this));
cc.sys.os === cc.sys.OS_ANDROID && this._am.setMaxConcurrentTask(2);
if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
console.log("jsw Run update loadLocalManifest");
this._am.loadLocalManifest(this._manifestUrl);
}
console.log("jsw Run update loadLocalManifest over");
if (this._am.getLocalManifest() && this._am.getLocalManifest().isLoaded()) {
this._am.setEventCallback(this.checkCb.bind(this));
this._am.checkUpdate();
this._updating = !0;
this._hotUpdateIng = !1;
} else {
console.log("Failed to load local manifest ...");
this.log("Failed to load local manifest ...");
this._finishCallback(o.ERROR);
this.reset();
}
}
};
t.prototype.checkCb = function(t) {
var e;
switch (t.getEventCode()) {
case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
e = "No local manifest file found.";
this.log("No local manifest file found.");
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
e = "Fail to download manifest file!";
this.log("Fail to download manifest file!");
break;

case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
e = "Fail PARSE manifest file.";
this.log("Fail PARSE manifest file.");
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
console.log("Already up to date with the latest remote version.");
this.log("Already up to date with the latest remote version.");
this._finishCallback(o.LATEST);
this.reset();
break;

case jsb.EventAssetsManager.NEW_VERSION_FOUND:
console.log("New version found, please try to update.");
this.log("New version found, please try to update.");
this.hotUpdate();
break;

case jsb.EventAssetsManager.READY_TO_UPDATE:
}
if (e) {
console.log("check callback: " + e);
this.log("check callback: " + e);
}
};
t.prototype.hotUpdate = function() {
if (!this._hotUpdateIng) {
this._updating = !0;
console.log("hotUpdate");
this.log("hotUpdate");
if (this._am) {
console.log("hotUpdateRun!");
this._hotUpdateIng = !0;
this._am.setEventCallback(this.updateCb.bind(this));
if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
this._am.loadLocalManifest(this._manifestUrl.customManifestStr);
console.log("hotUpdate 加载清单");
}
this._am.update();
}
}
};
t.prototype.updateCb = function(t) {
var e, s = !1;
switch (t.getEventCode()) {
case jsb.EventAssetsManager.UPDATE_PROGRESSION:
break;

case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
e = "No local manifest file found, hot update skipped.";
this.log("No local manifest file found, hot update skipped.");
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
e = "ERROR_DOWNLOAD_MANIFEST";
this.log("ERROR_DOWNLOAD_MANIFEST");
break;

case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
e = "ERROR_PARSE_MANIFEST";
this.log("ERROR_PARSE_MANIFEST");
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
console.log("Already up to date with the latest remote version.");
this.log("Already up to date with the latest remote version.");
this._finishCallback(o.LATEST);
this.reset();
break;

case jsb.EventAssetsManager.UPDATE_FINISHED:
s = !0;
break;

case jsb.EventAssetsManager.UPDATE_FAILED:
e = "UPDATE_FAILED";
this.log("UPDATE_FAILED");
this.failMsgNum++;
console.log("GameUpdate._am.downloadFailedAssets()          failMsgNum    = ", this.failMsgNum);
this._am.downloadFailedAssets();
}
if (e && 3 == this.failMsgNum) {
this.failMsgNum = 0;
console.log("update callback: " + e);
this.log("update callback: " + e);
this._finishCallback(o.ERROR);
this.reset();
} else if (s) {
this._am.setEventCallback(null);
var a = jsb.fileUtils.getSearchPaths(), n = this._am.getLocalManifest().getSearchPaths();
Array.prototype.unshift.apply(a, n);
cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify(a));
jsb.fileUtils.setSearchPaths(a);
cc.audioEngine.stopAll();
this.log("重启游戏");
console.log("重启游戏");
this._finishCallback(o.OVER);
this.reset();
}
};
t.prototype.reset = function() {
this._am.setEventCallback(null);
this._am = null;
};
t.prototype.log = function(t) {};
t.prototype.md5 = function(t) {
function e(t) {
var e = (t >>> 24).toString(16), s = (16777215 & t).toString(16);
return "00".substr(0, 2 - e.length) + e + "000000".substr(0, 6 - s.length) + s;
}
function s(t, e) {
return t << e & 4294967295 | t >>> 32 - e;
}
function o(t, e, s) {
return t & e | ~t & s;
}
function a(t, e, s) {
return s & t | ~s & e;
}
function n(t, e, s) {
return t ^ e ^ s;
}
function i(t, e, s) {
return e ^ (t | ~s);
}
function r(t, e) {
return t[e + 3] << 24 | t[e + 2] << 16 | t[e + 1] << 8 | t[e];
}
for (var l = [], c = 0; c < t.byteLength; c++) l.push(t[c]);
var h = l.length;
l.push(128);
var p = l.length % 64;
if (p > 56) {
for (c = 0; c < 64 - p; c++) l.push(0);
p = l.length % 64;
}
for (c = 0; c < 56 - p; c++) l.push(0);
l = l.concat(function(t) {
for (var e = [], s = 0; s < 8; s++) {
e.push(255 & t);
t >>>= 8;
}
return e;
}(8 * h));
var u = 1732584193, f = 4023233417, d = 2562383102, _ = 271733878, g = 0, m = 0, E = 0, b = 0;
function v(t, e) {
return 4294967295 & t + e;
}
var y = function(t, e, o, a) {
var n = b;
b = E;
E = m;
m = v(m, s(v(g, v(t, v(e, o))), a));
g = n;
};
for (c = 0; c < l.length / 64; c++) {
g = u;
var R = 64 * c;
y(o(m = f, E = d, b = _), 3614090360, r(l, R), 7);
y(o(m, E, b), 3905402710, r(l, R + 4), 12);
y(o(m, E, b), 606105819, r(l, R + 8), 17);
y(o(m, E, b), 3250441966, r(l, R + 12), 22);
y(o(m, E, b), 4118548399, r(l, R + 16), 7);
y(o(m, E, b), 1200080426, r(l, R + 20), 12);
y(o(m, E, b), 2821735955, r(l, R + 24), 17);
y(o(m, E, b), 4249261313, r(l, R + 28), 22);
y(o(m, E, b), 1770035416, r(l, R + 32), 7);
y(o(m, E, b), 2336552879, r(l, R + 36), 12);
y(o(m, E, b), 4294925233, r(l, R + 40), 17);
y(o(m, E, b), 2304563134, r(l, R + 44), 22);
y(o(m, E, b), 1804603682, r(l, R + 48), 7);
y(o(m, E, b), 4254626195, r(l, R + 52), 12);
y(o(m, E, b), 2792965006, r(l, R + 56), 17);
y(o(m, E, b), 1236535329, r(l, R + 60), 22);
y(a(m, E, b), 4129170786, r(l, R + 4), 5);
y(a(m, E, b), 3225465664, r(l, R + 24), 9);
y(a(m, E, b), 643717713, r(l, R + 44), 14);
y(a(m, E, b), 3921069994, r(l, R), 20);
y(a(m, E, b), 3593408605, r(l, R + 20), 5);
y(a(m, E, b), 38016083, r(l, R + 40), 9);
y(a(m, E, b), 3634488961, r(l, R + 60), 14);
y(a(m, E, b), 3889429448, r(l, R + 16), 20);
y(a(m, E, b), 568446438, r(l, R + 36), 5);
y(a(m, E, b), 3275163606, r(l, R + 56), 9);
y(a(m, E, b), 4107603335, r(l, R + 12), 14);
y(a(m, E, b), 1163531501, r(l, R + 32), 20);
y(a(m, E, b), 2850285829, r(l, R + 52), 5);
y(a(m, E, b), 4243563512, r(l, R + 8), 9);
y(a(m, E, b), 1735328473, r(l, R + 28), 14);
y(a(m, E, b), 2368359562, r(l, R + 48), 20);
y(n(m, E, b), 4294588738, r(l, R + 20), 4);
y(n(m, E, b), 2272392833, r(l, R + 32), 11);
y(n(m, E, b), 1839030562, r(l, R + 44), 16);
y(n(m, E, b), 4259657740, r(l, R + 56), 23);
y(n(m, E, b), 2763975236, r(l, R + 4), 4);
y(n(m, E, b), 1272893353, r(l, R + 16), 11);
y(n(m, E, b), 4139469664, r(l, R + 28), 16);
y(n(m, E, b), 3200236656, r(l, R + 40), 23);
y(n(m, E, b), 681279174, r(l, R + 52), 4);
y(n(m, E, b), 3936430074, r(l, R), 11);
y(n(m, E, b), 3572445317, r(l, R + 12), 16);
y(n(m, E, b), 76029189, r(l, R + 24), 23);
y(n(m, E, b), 3654602809, r(l, R + 36), 4);
y(n(m, E, b), 3873151461, r(l, R + 48), 11);
y(n(m, E, b), 530742520, r(l, R + 60), 16);
y(n(m, E, b), 3299628645, r(l, R + 8), 23);
y(i(m, E, b), 4096336452, r(l, R), 6);
y(i(m, E, b), 1126891415, r(l, R + 28), 10);
y(i(m, E, b), 2878612391, r(l, R + 56), 15);
y(i(m, E, b), 4237533241, r(l, R + 20), 21);
y(i(m, E, b), 1700485571, r(l, R + 48), 6);
y(i(m, E, b), 2399980690, r(l, R + 12), 10);
y(i(m, E, b), 4293915773, r(l, R + 40), 15);
y(i(m, E, b), 2240044497, r(l, R + 4), 21);
y(i(m, E, b), 1873313359, r(l, R + 32), 6);
y(i(m, E, b), 4264355552, r(l, R + 60), 10);
y(i(m, E, b), 2734768916, r(l, R + 24), 15);
y(i(m, E, b), 1309151649, r(l, R + 52), 21);
y(i(m, E, b), 4149444226, r(l, R + 16), 6);
y(i(m, E, b), 3174756917, r(l, R + 44), 10);
y(i(m, E, b), 718787259, r(l, R + 8), 15);
y(i(m, E, b), 3951481745, r(l, R + 36), 21);
u = v(u, g);
f = v(f, m);
d = v(d, E);
_ = v(_, b);
}
return function(t, s, o, a) {
for (var n = "", i = 0, r = 0, l = 3; l >= 0; l--) {
i = 255 & (r = arguments[l]);
i <<= 8;
i |= 255 & (r >>>= 8);
i <<= 8;
i |= 255 & (r >>>= 8);
i <<= 8;
n += e(i |= r >>>= 8);
}
return n;
}(_, d, f, u).toLowerCase();
};
return t;
}();
s.UpdateGame = a;
cc._RF.pop();
}, {} ],
hall: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "62f1cEgicZOHIK4RrhKKe9y", "hall");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = t("../../start/script/config/HotUpdateConfig"), a = t("../prefab/gameIcon/GameIcon"), n = cc._decorator, i = n.ccclass, r = (n.property, 
function(t) {
__extends(e, t);
function e() {
var e = null !== t && t.apply(this, arguments) || this;
e._is_lock = !1;
return e;
}
e.prototype.start = function() {};
e.prototype.onDownLoad = function(t) {
var e = this;
cc.sys.isNative && console.log("jsw 搜索路径", JSON.stringify(jsb.fileUtils.getSearchPaths()));
var s = t.currentTarget.getComponent(a.GameIcon);
console.log("jsw 当前锁状态", this._is_lock);
if (s.getGameType() !== a.GAME_TYPE.READY) if (s.getGameType() !== a.GAME_TYPE.UPDATE && s.getGameType() !== a.GAME_TYPE.CHECK_UPDATE) {
if (!this._is_lock) {
this._is_lock = !0;
s.downLoadGame(o.HotUpdateConfig.HotUpdateUrl, function(t) {
e._is_lock = !1;
});
}
} else {
console.log("启动游戏更新");
s.hotUpdate();
} else {
console.log("进入碰碰车");
cc.director.loadScene("ppc");
}
};
return e = __decorate([ i ], e);
}(cc.Component));
s.default = r;
cc._RF.pop();
}, {
"../../start/script/config/HotUpdateConfig": "HotUpdateConfig",
"../prefab/gameIcon/GameIcon": "GameIcon"
} ],
point: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "a7536ttT0tFs6/jjAubZYT7", "point");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = cc._decorator, a = o.ccclass, n = o.property, i = function(t) {
__extends(e, t);
function e() {
var e = null !== t && t.apply(this, arguments) || this;
e.item = null;
e.body = null;
e.title = null;
return e;
}
e.prototype.start = function() {};
e.prototype.setText = function(t) {
var e = cc.instantiate(this.item);
e.getComponent(cc.Label).string = t;
e.parent = this.body.node;
};
e.prototype.setTitle = function(t) {
this.title.string = t;
};
__decorate([ n(cc.Prefab) ], e.prototype, "item", void 0);
__decorate([ n(cc.Layout) ], e.prototype, "body", void 0);
__decorate([ n(cc.Label) ], e.prototype, "title", void 0);
return e = __decorate([ a ], e);
}(cc.Component);
s.Point = i;
cc._RF.pop();
}, {} ],
ppcMain: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "db27b/Wm0hKE737jVtWGE4U", "ppcMain");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = t("./ppcRun"), a = cc._decorator, n = a.ccclass, i = a.property, r = function(t) {
__extends(e, t);
function e() {
var e = null !== t && t.apply(this, arguments) || this;
e.root = null;
e.run = null;
return e;
}
e.prototype.onLoad = function() {
this.run = new o.ppcRun();
};
e.prototype.start = function() {
for (var t = 0; t < this.root.children.length; t++) {
var e = this.root.children[t];
e.addChild(new cc.Node());
e.children[0].addComponent(cc.Label).string = "" + (t + 1);
}
};
e.prototype.main = function() {
var t = Math.ceil(Math.random() * this.root.children.length);
console.log("随机数", t);
this.run.run(t, this.root);
};
__decorate([ i(cc.Node) ], e.prototype, "root", void 0);
return e = __decorate([ n ], e);
}(cc.Component);
s.ppcMain = r;
cc._RF.pop();
}, {
"./ppcRun": "ppcRun"
} ],
ppcRun: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "64c1b3gzUJKrKmPZ+WyWK6I", "ppcRun");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = function() {
function t() {
this.target = 5;
this.root = null;
this.start = 1;
this.move_array = [];
this.def_time = 0;
this.total_time = 10;
this.make_up_scale = .4;
}
t.prototype.run = function(t, e) {
this.target = t;
this.root = e;
this.move_array = [];
this.createMoveMap(this.getTargetNumber());
this.allocTime();
for (var s = 0, o = 0; o < this.move_array.length; o++) {
var a = this.move_array[o], n = this.root.getChildByName("" + a.index);
0 === o || a.isMakeUp ? n.runAction(cc.sequence(cc.delayTime(s), cc.fadeTo(a.start, 0), cc.fadeTo(a.end, 255))) : n.runAction(cc.sequence(cc.delayTime(s - 2 * this.def_time), cc.fadeTo(a.start, 0), cc.fadeTo(a.end, 255)));
s += a.start + a.end;
}
};
t.prototype.getTargetNumber = function() {
var t = this.target;
return t = t + 14 * this.root.children.length + 1;
};
t.prototype.createMoveMap = function(t) {
for (var e = this.root.children.length, s = 1; s < t; s++) {
var o = s % e;
0 === o ? this.move_array.push({
index: e
}) : this.move_array.push({
index: o
});
}
};
t.prototype.allocTime = function() {
var t = this.getMakeUpAndDefTime(), e = t.def / this.move_array.length / 2;
this.def_time = e;
for (var s = 0; s < this.move_array.length; s++) {
this.move_array[s].start = e;
this.move_array[s].end = e;
}
var o = t.make_up, a = .4 * o / 5 / 2, n = o - a;
n = n / 8 / 2;
this.setTopMakeUp(a, 5);
this.setBottomMakeUp(n, 8);
};
t.prototype.getMakeUpAndDefTime = function() {
var t = {
make_up: 0,
def: 0
};
t.make_up = this.total_time * this.make_up_scale;
t.def = this.total_time - t.make_up;
return t;
};
t.prototype.setTopMakeUp = function(t, e) {
void 0 === e && (e = 4);
for (var s = .8, o = 0; o <= e; o++) {
this.move_array[o].isMakeUp = !0;
if (0 === o) this.move_array[o].start += t, this.move_array[o].end += t; else {
s < 0 && (s = .1);
var a = t * s, n = t - a;
this.move_array[o].start += n, this.move_array[o].end += n;
this.move_array[o - 1].start += a, this.move_array[o - 1].end += a;
s -= .2;
}
}
};
t.prototype.setBottomMakeUp = function(t, e) {
void 0 === e && (e = 5);
for (var s = .4, o = this.move_array.length - (e + 1); o < this.move_array.length; o++) {
this.move_array[o].isMakeUp = !0;
if (o === this.move_array.length - 1) {
this.move_array[o].start += t, this.move_array[o].end += t;
break;
}
s > 1 && (s = 1);
var a = t * s, n = t - a;
this.move_array[o].start += n, this.move_array[o].end += n;
this.move_array[o + 1].start += a, this.move_array[o + 1].end += a;
s += .3;
}
};
return t;
}();
s.ppcRun = o;
cc._RF.pop();
}, {} ],
start: [ function(t, e, s) {
"use strict";
cc._RF.push(e, "20d1aSbKcRDxbnlflWDrYGR", "start");
Object.defineProperty(s, "__esModule", {
value: !0
});
var o = t("./config/HotUpdateConfig"), a = t("../../hall/script/download/DownLoad"), n = t("../../hall/script/download/UpdateGame"), i = cc._decorator, r = i.ccclass, l = (i.property, 
function(t) {
__extends(e, t);
function e() {
var e = null !== t && t.apply(this, arguments) || this;
e.root_path = "";
return e;
}
e.prototype.start = function() {
if (cc.sys.isNative) {
this.root_path = jsb.fileUtils.getWritablePath();
this.HotUpdate();
} else cc.director.loadScene("hall");
};
e.prototype.HotUpdateFile = function() {
return __awaiter(this, void 0, Promise, function() {
var t, e;
return __generator(this, function(s) {
switch (s.label) {
case 0:
t = this.root_path;
e = {
path: t + "/project.manifest"
};
console.log("jsw 查找文件", e.path);
return jsb.fileUtils.isFileExist(t + "/project.manifest") ? [ 3, 2 ] : [ 4, new a.DownloadsPromise().startDownLoad("" + o.HotUpdateConfig.HotUpdateUrl + cc.sys.localStorage.getItem("PackMd5"), "project.manifest") ];

case 1:
e = s.sent();
s.label = 2;

case 2:
return [ 2, new Promise(function(s, o) {
if (e.path && jsb.fileUtils.isFileExist(t)) {
console.log("jsw 文件是否存在", jsb.fileUtils.isFileExist(t));
s(e);
} else o("下载失败");
}) ];
}
});
});
};
e.prototype.HotUpdate = function() {
return __awaiter(this, void 0, void 0, function() {
var t;
return __generator(this, function(e) {
switch (e.label) {
case 0:
return [ 4, this.HotUpdateFile() ];

case 1:
if (!(t = e.sent()).path) {
console.log("jsw 下载清单失败", t);
return [ 2 ];
}
new n.UpdateGame().Run({
url: o.HotUpdateConfig.HotUpdateUrl,
storagePath: "test-default",
customManifestStr: this.root_path + "project.manifest"
}, function(t) {
console.log("jsw 热更消息", t);
switch (t) {
case n.UPDATE_TYPE.LATEST:
cc.director.loadScene("hall");
break;

case n.UPDATE_TYPE.OVER:
cc.game.restart();
break;

default:
console.log("jsw 热更新失败流程");
}
});
return [ 2 ];
}
});
});
};
return e = __decorate([ r ], e);
}(cc.Component));
s.default = l;
cc._RF.pop();
}, {
"../../hall/script/download/DownLoad": "DownLoad",
"../../hall/script/download/UpdateGame": "UpdateGame",
"./config/HotUpdateConfig": "HotUpdateConfig"
} ]
}, {}, [ "GameIcon", "point", "ChildHotUpdate", "DownLoad", "Manifest", "UpdateGame", "hall", "MD5", "ppcMain", "ppcRun", "Demo", "HotUpdateConfig", "start" ]);