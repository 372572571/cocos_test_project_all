
// 递归的做法实现

export class ProBarOrder {

    private _current_pro_num: number = 0; // 当前实际进度

    private _crrent_show_num: number = 0;// 已经显示的进度

    private _lock: boolean = false;

    private _set_time_out: number = null;

    public callback: (num: number) => void = () => { };

    public set current_pro_num(num: number) {
        if (this._current_pro_num >= num) return;
        this._current_pro_num = num;
        this.run()
    }

    private run() {
        if (this._lock !== false) return;
        this._lock = true;
        this.up();
    }

    private up() {
        if (this._crrent_show_num >= this._current_pro_num) {
            this.callback && this.callback(this._current_pro_num);
            this._lock = false;
            this.run()
            return;
        }
        if (this._set_time_out !== null) {
            clearTimeout(this._set_time_out);
            this._set_time_out = null;
        }
        this._set_time_out = setTimeout(() => {
            this._crrent_show_num += 1;
            this.callback && this.callback(this._crrent_show_num);
            this.up();
        }, 1000);
    }

    public clear() {
        this._crrent_show_num = 0;
        this._current_pro_num = 0;
        clearTimeout(this._set_time_out);
        this._set_time_out = null;
        this.callback = null;
        this._lock = false;
    }
}
