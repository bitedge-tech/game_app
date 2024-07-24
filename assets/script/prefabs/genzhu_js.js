// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },
    setMoney(money) {
        this.chouma_amount=money;

    },
    xiazhu(x1,y1,x2,y2){
        let n_chouma=this.node.getChildByName('chouma');
       // console.log(dp1);

        log('显示下注动画');
        n_chouma.x=x1;
        n_chouma.y=y1;
        n_chouma.active=true;
        let me=this;
        cc.tween(n_chouma)
            .to(0.2,{position:cc.v2(x2,y2)},)
            .call(function () {
                let lbl=me.node.getChildByName('lbl_chouma_count');
                lbl.getComponent(cc.Label).string=me.chouma_amount;
                lbl.active=true;
            })
            .start();
    },

    /**
     * 筹码移动到底池,隐藏跟注节点
     */
    chouMa2Dichi(x,y) {
        let n_chouma=this.node.getChildByName('chouma');

        let me=this;
        cc.tween(n_chouma)
            .to(0.2,{position:cc.v2(x,y)},)
            .call(function () {
                let lbl=me.node.getChildByName('lbl_chouma_count');
                lbl.getComponent(cc.Label).string=0;
                lbl.active=false
                me.node.active=false;

            })
            .start();
    }

    // update (dt) {},
});
