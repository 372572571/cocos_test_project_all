// // Learn TypeScript:
// //  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// // Learn Attribute:
// //  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// // Learn life-cycle callbacks:
// //  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
// import { UpdateGame } from "../../hall/script/download/UpdateGame"
// const { ccclass, property } = cc._decorator;

// @ccclass
// export class Demo extends cc.Component {

//     @property(cc.Label)
//     label: cc.Label = null;
//     @property(cc.Asset)
//     manifest: cc.Asset = null
//     @property(cc.Asset)
//     gameManifest: cc.Asset = null
//     updateStart: UpdateGame = null
//     // updateGame: UpdateGame = null

//     start() {
//         console.log(this.manifest)
//         this.updateStart = new UpdateGame()
//         this.updateStart.Run({
//             url: 'http://192.168.3.125:8099/static/',
//             storagePath: 'Game/Hall', manifestUrl: this.manifest
//         }, () => {
//             console.log("热更流程结束");
//         })
//     }

//     // onUpdateGame() {
//     //     console.log(this.gameManifest)
//     //     this.updateGame = new UpdateGame()
//     //     this.updateGame.Run({
//     //         url: 'http://127:8099/static/game',
//     //         storagePath: 'Game/Game', manifestUrl: this.gameManifest
//     //     }, () => {
//     //         console.log("热更流程结束");
//     //     })
//     // }

//     goGame() {
//         cc.director.loadScene("game", () => {
//             console.log("进入游戏")
//         })
//     }
// }
