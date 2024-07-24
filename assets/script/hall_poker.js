
cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // let userInfo={uid:data.uid,user_no:data.userno,nick_name:data.nickname,headimg:data.headimg,coin:data.coin,sex:data.sex}

        this.getUserInfoFromServer();
        let userInfo = JSON.parse(localStorage.getItem('userInfo'));

        cc.find('Canvas/top_left/lbl_nickname').getComponent(cc.Label).string=userInfo.nick_name;
        cc.find('Canvas/top_left/lbl_userid').getComponent(cc.Label).string=userInfo.user_no;
        cc.find('Canvas/top_left/lbl_diamond_sum').getComponent(cc.Label).string=userInfo.diamond_amount;
        cc.find('Canvas/top_left/lbl_gmoney_sum').getComponent(cc.Label).string=userInfo.coin;

        //头像
        let himg=cc.find('Canvas/top_left/user_head_area/n_headimg').getComponent(cc.Sprite);
        cc.loader.loadRes('role/'+userInfo.headimg, cc.SpriteFrame,function (err, sptF) {
            himg.spriteFrame=sptF;
        });

    },

    start () {

    },

    // update (dt) {},

    /**
     * 创建一个房间
     */
    btn_click_createGame_dialog() {
        let dialog=cc.find('Canvas/n_dialog_create');
        dialog.active=true;
        dialog.position=cc.v2(0,930)
        cc.tween(dialog)
            .to(0.2,{position:cc.v2(0,0)})
            .start()
    },

    btn_click_roomdialog_close(){
        let dialog=cc.find('Canvas/n_dialog_create');
        dialog.active=false;
    },

    select_dxm_value() {

        let dxm_sum = cc.find('Canvas/n_dialog_create/tc_dxm_sum').getComponent(cc.ToggleContainer);
        let jifeng_sum = cc.find('Canvas/n_dialog_create/tc_coin_sum').getComponent(cc.ToggleContainer);

        //获到当前选中的值
        let dxm_n_name=this.getToggleContainerCheckNodeName(dxm_sum);
        let dxm=dxm_n_name.split('_')[1];
        let damangV=0;
        //修改积分中的值
        switch (dxm) {
            case 'dx1':
                damangV=10*2;
                break;
            case 'dx2':
                damangV=20*2;
                break;
            case 'dx3':
                damangV=30*2;
                break;
            case 'dx4':
                damangV=40*2;
                break;
            case 'dx5':
                damangV=50*2;
                break;
            case 'dx8':
                damangV=80*2;
                break;
            case 'dx10':
                damangV=100*2;
                break;
            default:
                break;
        }

        this.setCoinToggleValue(jifeng_sum,damangV)

    },

    setCoinToggleValue(toggleC, startVaue) {
        let coinV=0;
        let i=1;
        for (let item of toggleC.toggleItems) {
            coinV=startVaue*100*i;
            item.node.getChildByName('lbl_amount').getComponent(cc.Label).string=coinV;
            i++;
        }

        toggleC.toggleItems[0].isChecked=true;
    },


    /**
     * 提交创建房间
     */
    btn_createroom_sure() {
        let time_sum = cc.find('Canvas/n_dialog_create/tc_time_sum').getComponent(cc.ToggleContainer);
        let user_sum = cc.find('Canvas/n_dialog_create/tc_user_sum').getComponent(cc.ToggleContainer);
        let dxm_sum = cc.find('Canvas/n_dialog_create/tc_dxm_sum').getComponent(cc.ToggleContainer);
        let jifeng_sum = cc.find('Canvas/n_dialog_create/tc_coin_sum').getComponent(cc.ToggleContainer);
        let tm_sum_v = this.getToggleContainerCheckNodeName(time_sum);
        let us_sum_v = this.getToggleContainerCheckNodeName(user_sum);
        let dx_sum_v = this.getToggleContainerCheckNodeName(dxm_sum);
        let jf_sum_v = this.getToggleContainerCheckNodeName(jifeng_sum);

        log(tm_sum_v)
        log(us_sum_v)
        log(dx_sum_v)
        log(jf_sum_v)

        //时长, 分钟
        let tm_v = tm_sum_v.split('_')[1].substr(1);

        //人数
        let us_v = us_sum_v.split('_')[1].substr(1);

        //小盲值
        let xm_v=dx_sum_v.split('_')[1].substr(2)*10;

        //倍数
        let jf_bs=jf_sum_v.split('_')[1].substr(0,3);
        let jf_v=jf_bs*xm_v*2;


        //创建房间
        this.createGame_submit(tm_v, us_v, xm_v, jf_v);

    },

    /**
     * 获得单选组中选中项的节点名称
     * @param toggle_container
     * @returns {string}
     */
    getToggleContainerCheckNodeName(toggle_container) {
        let nm='';

        for (let item of toggle_container.toggleItems) {
            let tg=item.getComponent(cc.Toggle);
            if(tg.isChecked){
                 nm=item.node.name;
                break;
            }
        }

        return nm;
    },


    /**
     *
     * @param time_v 时间长,分钟;
     * @param user_v 人数;
     * @param xm_v   小盲值;
     * @param jf_v   积分值;
     */
    createGame_submit(time_v,user_v,xm_v,jf_v) {
        let user=JSON.parse(localStorage.getItem('userInfo'));
        let uno=user.user_no;

        cc.ut.http2.sendRequest("/game/cr",{userno:uno,gtype:1,timevalue:time_v,limit_coin:jf_v,seatnum:user_v,xm_v:xm_v},function (rs) {
            console.log(rs);
            if(rs && rs.code===1){
                //from:  1-创建房单, 2加入
                cc.ut.enterRoomArgs={rid:rs.rid,roomcode:rs.room_code,gametype:1,type:1}
                cc.director.loadScene('poker');
            }
            else{
                //todo 用提示框提示信息;
                console.log('服务器错误!')
            }
        })

    },

    /**
     * 加入房间
     */
    joinGame(rno){
        let user=JSON.parse(localStorage.getItem('userInfo'));
        let uid=user.uid;
        let roomcode=rno

        cc.ut.http2.sendRequest("/game/jr",{uid:uid,roomcode:roomcode},function (rs) {
            console.log(rs);
            if(rs && rs.code===1){
                //from:  1-创建房单, 2加入
                cc.ut.enterRoomArgs={rid:rs.data.rid,roomcode:rs.data.roomcode,gametype:1}
                cc.director.loadScene('poker');
            }
            else{
                //todo 用提示框提示信息;
                console.log('服务器错误!')
            }
        })
    },

    btn_exit_click(){
        localStorage.setItem('userInfo', '');
        cc.director.loadScene('login');
    },

    /**
     * 从服务器获取用户信息
     */
    getUserInfoFromServer(){
        let user=JSON.parse(localStorage.getItem('userInfo'));
        let uid=user.uid;

        cc.ut.http2.sendRequest("/user/gui",{uid:uid},function (rs) {
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
            }
            else{
                //todo 用提示框提示信息;
                console.log('服务器错误!')
            }
        })
    },

    btn_enterroom_open_dialog() {

        cc.find('Canvas/n_dialog/lbl_room_no').getComponent(cc.Label).string = '';
        let dialog=cc.find('Canvas/n_dialog');
        dialog.active=true;
        dialog.position=cc.v2(0,820)
        cc.tween(dialog)
            .to(0.2,{position:cc.v2(0,0)})
            .start()
    },

    btn_dialog_close(){
        let dialog=cc.find('Canvas/n_dialog');
        dialog.active=false;

    },

    btn_keyup_number(e,args){
        let num=args;

        let room_no=cc.find('Canvas/n_dialog/lbl_room_no').getComponent(cc.Label).string;
        room_no=room_no+args+' ';
        if (room_no.length <=12) {
            cc.find('Canvas/n_dialog/lbl_room_no').getComponent(cc.Label).string=room_no;
        }

        if (room_no.length == 12) {
            //进入房间;
            let rno=room_no.split(' ').join('');
            this.joinGame(rno);
        }


    },

    btn_reset_click(){
        cc.find('Canvas/n_dialog/lbl_room_no').getComponent(cc.Label).string='';
    },

    btn_backspace_click(){
        let room_no=cc.find('Canvas/n_dialog/lbl_room_no').getComponent(cc.Label).string;
        room_no=room_no.substr(0,room_no.length-2);
        cc.find('Canvas/n_dialog/lbl_room_no').getComponent(cc.Label).string=room_no;

    }

});
