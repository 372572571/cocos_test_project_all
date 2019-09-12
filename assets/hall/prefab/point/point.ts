
const { ccclass, property } = cc._decorator;

@ccclass
export class Point extends cc.Component {

    @property(cc.Prefab)
    public item: cc.Prefab = null;
    @property(cc.Layout)
    public body: cc.Layout = null;
    @property(cc.Label)
    public title: cc.Label = null;


    start() {
    }
    public setText(str: string): void {
        let temp = cc.instantiate(this.item);
        temp.getComponent(cc.Label).string = str;
        temp.parent = this.body.node;
    }
    public setTitle(str: string): void {
        this.title.string = str;
    }
}
