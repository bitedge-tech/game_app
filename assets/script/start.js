


function initMgr() {

    cc.ut={};
    // cc.ut.wsServer='ws://119.3.157.25:6001';
    // cc.ut.http = require("./utils/HTTP");
    cc.ut.http2=require("./utils/HTTP2");
    // cc.ut.moment=require('./utils/moment');
}

cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        initMgr();
        cc.director.loadScene('login');
    },

    start () {

    },

    // update (dt) {},
});
