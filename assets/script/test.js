// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        pai:{
            type:cc.Node,
            default:null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    // update (dt) {},

    btn_click_fanpai(){
        let fanpai_js=this.pai.getComponent("fanpai_js");
        fanpai_js.setPaiValue('50');
        fanpai_js.fanPai_do();
    },

    btn_click_fapai(){
        let fapai=cc.find('Canvas/pdipai/n_dipai');
        let fapai_spt=fapai.getComponent('ndipai_js');
        fapai_spt.fapai1(0,0,-200,-200);

    },

    btn_click_jiazhu(e) {
        let slide=cc.find('Canvas/slider');
        let v=slide.getComponent(cc.Slider).progress;

        console.log(v);
    }


});
