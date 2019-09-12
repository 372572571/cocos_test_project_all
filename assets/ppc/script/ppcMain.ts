
import { ppcRun } from "./ppcRun";
const { ccclass, property } = cc._decorator;

@ccclass
export class ppcMain extends cc.Component {
    @property(cc.Node)
    public root: cc.Node = null;

    public run: ppcRun = null;
    onLoad() {
        this.run = new ppcRun()
    }
    start() {

        for (let i = 0; i < this.root.children.length; i++) {
            let node = this.root.children[i]
            node.addChild(new cc.Node())
            node.children[0].addComponent(cc.Label).string = `${i + 1}`;
        }
    }

    public main() {
        // 随机生成1-28
        let num = Math.ceil(Math.random() * this.root.children.length);
        console.log('随机数', num);
        this.run.run(num, this.root);
    }
}
