
cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {},

    start () {

    },

    // update (dt) {},

    /**
     *
     */
    btn_phone_login_click(){
        let username = cc.find('Canvas/n_login_dialog/edit_phone').getComponent(cc.EditBox).string;
        let pwd= cc.find('Canvas/n_login_dialog/edit_pwd').getComponent(cc.EditBox).string;


        cc.ut.http2.sendRequest("/login/l",{username:username,pwd:pwd},function (rs) {
            console.log(rs);
            if(rs && rs.code===1){

                let data=rs.data;
                let userInfo={
                    uid:data.uid,
                    user_no:data.userno,
                    nick_name:data.nickname,
                    headimg:data.headimg,
                    coin:data.coin,
                    sex:data.sex,
                    diamond_amount:data.diamond_amount
                }
                localStorage.setItem('userInfo',JSON.stringify(userInfo));
                cc.director.loadScene("hall");
            }
            else{
                //todo 用提示框提示信息;
                console.log('服务器错误!')
            }
        })
    },

    btn_logindialog_close(){
        let dialog=cc.find('Canvas/n_login_dialog');
        dialog.active=false;

    },

    btn_phone_login() {
        let dialog=cc.find('Canvas/n_login_dialog');
        dialog.active=true;
        dialog.position=cc.v2(0,650)
        cc.tween(dialog)
            .to(0.2,{position:cc.v2(0,0)})
            .start()
    }
});
