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

    /**
     * x1,y1 移动到 x2,y2
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    fapai1(x1,y1,x2,y2){
        let dp1=this.node.getChildByName('dipai1');
       // console.log(dp1);

        dp1.x=x1;
        dp1.y=y1;
        dp1.active=true;
        dp1.opacity=255;
        cc.tween(dp1)
            .to(0.2,{position:cc.v2(x2,y2)},)
            .to(0.05,{angle:10})
            .start();

    },
    fapai2(x1,y1,x2,y2){
        let dp2=this.node.getChildByName('dipai2');
        // console.log(dp1);

        dp2.x=x1;
        dp2.y=y1;
        dp2.active=true;
        dp2.opacity=255;
        cc.tween(dp2)
            // .to(0.2,{position:cc.v2(x2,y2),easing: 'sineOutIn'},)
            .to(0.2,{position:cc.v2(x2,y2)},)
            .to(0.05,{angle:-10})
            .start();

    },

    /**
     * 弃牌动画
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    qipai(x1, y1, x2, y2) {
        let dp1=this.node.getChildByName('dipai1');
        // console.log(dp1);
        dp1.x=x1;
        dp1.y=y1;
        cc.tween(dp1)
            .to(0.2,{position:cc.v2(x2,y2),opacity:0},)
            .call(()=>{
                dp1.active=false;
            })
            .start();

        let dp2=this.node.getChildByName('dipai2');
        dp2.x=x1;
        dp2.y=y1;
        dp2.active=true;
        cc.tween(dp2)
            .to(0.2,{position:cc.v2(x2,y2),opacity:0},)
            .call(()=>{
                dp1.active=false;
            })
            .start();

    }



    // update (dt) {},
});
