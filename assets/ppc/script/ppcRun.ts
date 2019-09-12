// ppc 开奖动画
export class ppcRun {

    public target: number = 5; // 移动到的目标

    public root: cc.Node = null; // 主节点

    public start: number = 1 // 启动位置

    private move_array: moveItem[] = []; // 存放运动数组

    private def_time: number = 0; // 平均值

    private total_time: number = 10; // 总运动时间单位秒（可分配的时间）

    private make_up_scale: number = 0.4; // 补偿比例

    // 运行
    public run(num: number, root: cc.Node) {
        this.target = num
        this.root = root;
        this.move_array = []
        this.createMoveMap(this.getTargetNumber())
        this.allocTime()
        let add_time = 0;// 叠加时间
        for (let i = 0; i < this.move_array.length; i++) {
            let item = this.move_array[i];
            // 设置动画
            let node = this.root.getChildByName(`${item.index}`) // 获取节点
            if (i === 0 || item.isMakeUp) {
                node.runAction(cc.sequence(cc.delayTime(add_time), cc.fadeTo(item.start, 0), cc.fadeTo(item.end, 255)))
            } else {
                node.runAction(cc.sequence(cc.delayTime(add_time - (this.def_time * 2)), cc.fadeTo(item.start, 0), cc.fadeTo(item.end, 255)))
            }
            add_time += (item.start + item.end)
        }
    }

    // 获取移动到目标要多少次
    private getTargetNumber(): number {
        let res = this.target
        let temp = (this.root.children.length) * 14
        res = res + temp + 1;
        return res;
    }

    // 创建数组
    private createMoveMap(num: number) {
        let m = this.root.children.length
        for (let i = 1; i < num; i++) {
            let index = i % m;
            if (index === 0) {
                this.move_array.push({ index: m })
            } else {
                this.move_array.push({ index: index })
            }
        }
    }
    // 分配时间
    private allocTime() {
        let time = this.getMakeUpAndDefTime() // 分配补偿时间,和默认时间
        let def_time = (time.def / this.move_array.length) / 2
        this.def_time = def_time // 平均值
        // 平分平均时间
        for (let i = 0; i < this.move_array.length; i++) {
            this.move_array[i].start = def_time;
            this.move_array[i].end = def_time;
        }
        // 头&尾个补偿时间
        let top = 5 // 头部补偿动作个数
        let bottom = 8 //尾部补偿动作个数
        let temp = time.make_up;
        let top_temp = (temp * 0.4 / top) / 2; // 头部补偿时间
        let bottom_temp = temp - top_temp;
        bottom_temp = (bottom_temp / bottom) / 2// 尾巴补偿时间
        // 头部
        this.setTopMakeUp(top_temp, top);
        //尾部
        this.setBottomMakeUp(bottom_temp, bottom);
    }

    // 分割补偿时间和平均运动时间
    private getMakeUpAndDefTime(): { make_up: number, def: number } {
        let res = { make_up: 0, def: 0 };
        res.make_up = this.total_time * this.make_up_scale;
        res.def = this.total_time - res.make_up;
        // console.log(res);
        return res;
    }

    /**
     * 头部补偿
     *
     * @private
     * @param {number} time //补偿的平均时间 time*2 = 单个动作的补偿时间
     * @param {number} [num=4] // 给前几个补偿运动时间 默认4
     * @memberof ppcRun
     */
    private setTopMakeUp(time: number, num: number = 4): void {
        // 头部
        let top_tq = 0.80
        for (let i = 0; i <= num; i++) {
            this.move_array[i].isMakeUp = true;
            if (i === 0) {// 第一个不改变
                this.move_array[i].start += time, this.move_array[i].end += time
            } else { // 加速补偿，从自己身上偷一点时间给上一位 /2
                top_tq < 0 ? top_tq = 0.1 : ''; // 不可以小于0.1极限
                let t = time * top_tq;  // 偷取数值
                let s = time - t; // 偷取后剩余
                this.move_array[i].start += s, this.move_array[i].end += s // 添加被偷取完后的时间
                this.move_array[i - 1].start += t, this.move_array[i - 1].end += t // 增加偷取补偿时间
                top_tq = top_tq - 0.2 // 偷取逐渐减少（速度加快了）}
            }
        }
    }

    // 尾部补偿
    private setBottomMakeUp(time: number, num: number = 5): void {
        //尾部
        let bottom_tq = 0.4 // 基础偷取数值
        for (let i = this.move_array.length - (num + 1); i < this.move_array.length; i++) {
            this.move_array[i].isMakeUp = true;
            if (i === this.move_array.length - 1) { // 最后一个不偷取
                this.move_array[i].start += time, this.move_array[i].end += time;
                break;
            } else { // 减速补偿,从自己身上偷一点给上位
                bottom_tq > 1 ? bottom_tq = 1 : '';
                let t = time * bottom_tq;  // 偷取数值 （偷取数值渐增）
                let s = time - t; // 偷取后剩余
                this.move_array[i].start += s, this.move_array[i].end += s;
                // 偷取
                this.move_array[i + 1].start += t, this.move_array[i + 1].end += t;
                bottom_tq += 0.3
            }
        }
    }
}

interface moveItem {
    index: number;
    start?: number;
    end?: number;
    isMakeUp?: boolean;
}