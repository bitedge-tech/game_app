// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        ns_fanpai:{
            type:cc.Node,
            default:null,
        },
        pai_value:"",
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    fanPai_do(){
        let nd=this.ns_fanpai;
        let pai=this.pai_value;
        console.log("pai")
        console.log(pai)
        cc.tween(nd)
            .to(0.2,{scaleX:0,skewY:10} )
            // .call(()=>{nd.skewY=-10})
            .to(0.01,{skewY:-10})
            .call(()=>{
                cc.loader.loadRes('poker/c'+pai, cc.SpriteFrame,function (err, sptF) {
                    console.log(nd);
                    nd.getComponent(cc.Sprite).spriteFrame=sptF;
                })

            })
            .to(0.2,{scaleX:1,skewY:0})
           // .call(()=>{console.log('2 end')})
            .start();
    },
    setPaiValue(value) {
        this.pai_value=value;
    }

    // update (dt) {
    //     // console.log( this.timeSum);
    //     // console.log(this.ns_fanpai.scaleX)
    //     // console.log(this.ns_fanpai.skewY)
    //     // console.log("\n")
    //     // this.timeSum+=dt;
    //     //
    //     // if(this.timeSum<=2){
    //     //     console.log('小于2')
    //     //     if(this.ns_fanpai.scaleX>0 &&  this.ns_fanpai.scaleX<=1)
    //     //     {
    //     //         this.ns_fanpai.scaleX=this.ns_fanpai.scaleX-0.05;
    //     //
    //     //     }
    //     //
    //     //     if(this.ns_fanpai.skewY<15)
    //     //     {
    //     //         this.ns_fanpai.skewY+=1;
    //     //     }
    //     //
    //     // }else if(this.timeSum<=4)
    //     // {
    //     //    console.log('大于2小于4')
    //     //     if(this.ns_fanpai.scaleX<=1)
    //     //     {
    //     //         this.ns_fanpai.scaleX=this.ns_fanpai.scaleX+0.05;
    //     //
    //     //     }
    //     //
    //     //     if(this.ns_fanpai.skewY>0)
    //     //     {
    //     //         this.ns_fanpai.skewY-=1;
    //     //     }
    //     // }
    //
    // },


});
