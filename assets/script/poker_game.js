
let ws;
let timer_server=null;
// const url='ws://127.0.0.1:6001';
const url='ws://192.168.3.217:6001';

// const url='ws://119.3.157.25:6001';
// const url='ws://192.168.0.100:6001';
/**
 * 生成"消息体", 用来发送给服务端
 * @param cmd
 * @param msg
 * @param content
 * @returns {{msg, data, from, cmd, time: number, rid, token: string}}
 */
function mkData(cmd, msg, content = {}) {
    let d = {
        token: '',
        from: JSON.parse(localStorage.getItem('userInfo')).uid,
        rid: cc.ut.enterRoomArgs.rid,
        cmd: cmd,
        time: Date.parse(new Date()) / 1000,
        msg: msg,
        data: content
    }

    return JSON.stringify(d);
}

function startWebSocket(g){

    if(timer_server) {
        log("timer:")
        log(timer_server)
        clearInterval(timer_server);
    }

    ws = new WebSocket(url);

    ws.onopen = function(e){
        console.log('Connection to server ');

        ws.send(mkData(11, "加入房间"));
    }

    //收到消息处理
    ws.onmessage = function (e) {
        var data = JSON.parse(e.data);
        log("from server:");
        log(data);
        log('********** cmd end *********')
        switch (data.cmd) {
            case 10: //创建一个房间
                break;
            case 11:
                //进入房单
                g.handleEnter(data.data);
                break;
            case 12:
                //进入房单
                g.handleExitGame(data);
                break;
            case 101:
                //开始指令
                g.handleStart(data.data);
                break;
            case 110:
                //发底牌,设置d位, 小,大盲注
                g.handleDipai(data.data);
                break;
            case 120:
                //叫牌倒计时
                g.handleCallTimer(data.data);
                break;

            case 102: //跟注
            case 109: //过牌
                //处理跟注指令
                g.handleGenzhu(data);
                break;
            case 103:
                //加注
                g.handleJiazhu(data);
                break;
            case 104:
                //弃牌
                g.handleQipai(data);
                break;
            case 105:
                //全下
                g.handleAllin(data);
                break;
            case 111:
                //三张公共牌
                g.handleStepFan(data);
                break;
            case 112:
                //第四张公共牌
                g.handleStepZhuan(data);
                break;
            case 113:
                //第5张公共牌
                g.handleStepHe(data);
                break;
            case 130:
                //收筹码指令
                g.handleShouChouma(data);
                break;

            case 150:
                //明牌
                g.handleMingdipai(data);
                break;

            case 200:
                //处理获胜者指令；
                g.handleWinner(data);

                //重置游戏为初始状态， 等待开始；
                break;

            case 201:
                //弃牌后,游戏结束；
                g.handleWinner2(data);

                break;
            case 300:
                //重新开始新局准备
                g.handleRestartGame(data);
                break;

            case 350:
                //余额不足
                g.handleYuEBuzhu(data);
                break;
            case 999:
                //停止游戏
                g.handleStopGame(data);
                break;

            default:
                //其他
                log('unhandle cmd:')
                console.log(data);
                break
        }
    }

    //监听连接关闭情况
    ws.onclose = function (e) {
        ws.send(mkData(-1,"断开连接"));
        console.log("Connection closed");
        timer_server = setInterval(startWebSocket, 5000,g);
    }

};



cc.Class({
    extends: cc.Component,

    properties: {
        n_dseat:{
            default:null,
            type:cc.Node
        },


        /*******************************************  start audio property*/
        bg_audio:{
            default: null,
            type:cc.AudioClip
        },
        allin_boy:{
            default: null,
            type:cc.AudioClip
        },
        allin_girl:{
            default: null,
            type:cc.AudioClip
        },
        //跟
        call_boy:{
            default: null,
            type:cc.AudioClip
        },
        call_girl:{
            default: null,
            type:cc.AudioClip
        },
        check_boy:{
            default: null,
            type:cc.AudioClip
        },
        check_girl:{
            default: null,
            type:cc.AudioClip
        },
        fold_boy:{
            default: null,
            type:cc.AudioClip
        },
        fold_girl:{
            default: null,
            type:cc.AudioClip
        },
        raise_boy:{
            default: null,
            type:cc.AudioClip
        },
        raise_girl:{
            default: null,
            type:cc.AudioClip
        },

        fapai:{
            default: null,
            type:cc.AudioClip
        },
        kaipai:{
            default: null,
            type:cc.AudioClip
        },

        audio_shouchouma:{
            default: null,
            type:cc.AudioClip
        },


        audio_winner:{
            default: null,
            type:cc.AudioClip
        },
        audio_lose:{
            default: null,
            type:cc.AudioClip
        }

        /*******************************************  end audio property*/

    },
    ctor(){
        this.roomInfo={}; //房间基本信息 {rid:rs.rid,roomcode:rs.room_code,gametype:1,type:1}
        this.meInfo={}; //当前玩家
        this.usList={}; //其他玩家
        this.userInfo={};//登录数据;
        this.seatList={};

        this.jiazhu_amount=0; //记录加注金额的变动, 跟注的时候自动显示出来, 并可以使用来跟注;
        this.call_seat_no=-1; //记录在叫牌的坐位号;
        this.timerTween=null;

        this.audio={};
        this.autoOP=0; //自动操作参数:１－让或弃, 2-自动让, 3-跟任何注

    },


    /**
     * 载入游戏进的初化;
     */
    initGame(){
        this.n_5card = this.node.getChildByName('n_5cards');
        this.users = this.node.getChildByName('users');
        this.n_btn_footer = this.node.getChildByName('n_btn_footer');
        this.n_dichi = this.node.getChildByName('n_dichi');
        this.lbl_msg = this.node.getChildByName('lbl_msg');
        this.lbl_waiting = this.node.getChildByName('lbl_waiting');
        this.btn_start = this.node.getChildByName('btn_start');

        /**
         *将所有不需要显示的节点设置为不可见
         */
        // this.n_5card.active = false;
        // this.n_dichi.active = false;
        this.n_5card.children.forEach((v,i)=>{
            v.active=false;
        })

        this.lbl_waiting.y = 10;
        // this.n_btn_footer.active = false;

        //用户节点中不需要显示的数据
        for (let i = 1; i < 10; i++) {
            let uname = 'u' + i;
            //console.log(uname);
            //console.log(users.getChildByName(uname).getChildByName('D').active)
            //D不可见

            this.users.getChildByName(uname).getChildByName('D').active = false;
            this.users.getChildByName(uname).getChildByName('pre_genzhu').active = false;
            this.users.getChildByName(uname).getChildByName('game_seat').getChildByName('lbl_wincoin').active=false;
            this.users.getChildByName(uname).getChildByName('game_seat').getChildByName('n_winouter').active=false;
            this.users.getChildByName(uname).getChildByName('game_seat').getChildByName('n_mingpai').active=false;

            if (i != 5) {
                // this.users.getChildByName(uname).getChildByName('n_dipai').active = false;

                this.users.getChildByName(uname).active = false;
            } else {
                this.users.getChildByName(uname).getChildByName('dipai01').active = false;
                this.users.getChildByName(uname).getChildByName('dipai02').active = false;


            }
        }
    },

    /**
     * 进入新的一轮, 重置相关的数据;
     */
    initNextStep(uslist) {
        //设置未弃牌的用户状态, 把状态改为未操作, 显示昵称, 除了all in的不动;
        for (let item of uslist) {
            let seat_name = this.findRealSeat(item.seat_no);
            this.displayNickname(seat_name);
        }
    },


    onLoad() {
        this.roomInfo=cc.ut.enterRoomArgs;

        //重置界面显示
        this.initGame();

        //判断有效性: 1.创建房间后进入, 2加入房间
        console.log(cc.ut.enterRoomArgs);

        if (!cc.ut.enterRoomArgs) {
            cc.director.loadScene('hall');
            return;
        }

        cc.find("Canvas/lbl_room_code").getComponent(cc.Label).string="房号: "+this.roomInfo.roomcode;

        //登录数据
        this.userInfo=JSON.parse(localStorage.getItem("userInfo"));
        //创建websocket连接

       startWebSocket(this);

       //插入背景音乐
        this.audio.bg = cc.audioEngine.play(this.bg_audio, true, 0.5);

    },

    start() {

    },

    update(dt) {

    },

    onDestroy() {
        cc.audioEngine.stop(this.audio.bg);
    },

    /*************-handle start *******************/

    handleEnter(content){

        let new_user=content[0];
        let room_base_info=content[2];
        Object.assign(this.roomInfo,room_base_info); //更新 seat_num,sum_user,valid_time 坐位数, 已有人数, 有效时间
        this.uslist=content[1];  //更新玩家列表;

        this.node.getChildByName('lbl_sum_user').getComponent(cc.Label).string="人数: "+room_base_info['sum_user']+"/"+room_base_info['seat_num'];
        this.node.getChildByName('lbl_valid_time').getComponent(cc.Label).string="时效: "+room_base_info['valid_time'];

        log('this uid-new_uid')
        console.log(this.userInfo.uid+','+new_user.uid);
        if(new_user.uid==this.userInfo.uid)
        {
            //
            //是当前进入的用户, 需要设置自己, 还要载入其他所有在房间的用户
            //如果是当前用户
            this.meInfo=new_user;
            //载入所有在房间的用户到界面上;
            for(let key in content[1])
            {
                let data=content[1][key];
                this.sitdown(data);

            }
        }
        else {
            //不是当前用户, 把新进入的人员进行"入座"
            this.sitdown(new_user);
        }
    },

    handleStart(data){

        if(data.uid==this.userInfo.uid)
        {
            //自己的开始事件
            this.hideReadyInfo("u5");
            cc.find("Canvas/btn_start").active=false;

        }
        else{
            //接收别人的"开始"指令
            let real_seat=this.findRealSeat(data.seat_no);
            this.hideReadyInfo(real_seat);

        }
    },

    /**
     * 给所有用户发底牌
     * @param data
     */
    handleDipai(data){


       let waiting= cc.find('Canvas/lbl_waiting');
       waiting.active=false;

        if(data.uid==this.userInfo.uid){

            let ulist=data.userlist;
            let seatlist=[];
            let d_seat=data.paiju['d_seat'];

            //显示D位
            let d_r_seat=this.findRealSeat(d_seat);
            this.setDSeat(d_r_seat);

            //下小盲注, 大盲注
            let xm_value=data.paiju['xm_value']
            let xm_seat=data.paiju['xm_seat'];
            xm_seat=this.findRealSeat(xm_seat);
            this.xiaZhuFunc(xm_seat,xm_value);

            let dm_value=data.paiju['dm_value']
            let dm_seat=data.paiju['dm_seat'];
            dm_seat=this.findRealSeat(dm_seat);

            this.xiaZhuFunc(dm_seat,dm_value);

            /*****************************/

            let dipai=data['dipai'].split(',');

            //本人的底牌1节点
            let n1=cc.find('Canvas/users/u5/dipai01');
            let n1_scpt=n1.getComponent('fanpai_js');
            n1_scpt.setPaiValue(dipai[0].toString());
            cc.loader.loadRes('poker/cb', cc.SpriteFrame,function (err, sptF) {
                n1.getComponent(cc.Sprite).spriteFrame=sptF;
            })

            //本人的底牌2节点
            let n2=cc.find('Canvas/users/u5/dipai02');
            let n2_scpt=n2.getComponent('fanpai_js');
            n2_scpt.setPaiValue(dipai[1].toString());
            cc.loader.loadRes('poker/cb', cc.SpriteFrame,function (err, sptF) {
                n2.getComponent(cc.Sprite).spriteFrame=sptF;
            })

            //获得每个用户的真实座位;
           for(let usr of ulist){
               seatlist.push(this.findRealSeat(usr.seat_no));

               //更新一下界面上的用户的余额
               this.setUserCoin(this.findRealSeat(usr.seat_no),usr.coin);
           }

           //座位号从小-大排序
           seatlist.sort();
           // console.log(seatlist);

           let i=0;
           let n=seatlist.length;
           let thiso=this;

           //开始发牌动画, 及牌动画
            let audio_fapa=this.fapai;
           let ff=setInterval(function () {

               cc.audioEngine.play(audio_fapa, false, 1);

               if(i<n)
               {
                   //发第一轮底牌
                   thiso.fapaiFunc(seatlist[i],1);

                   //翻开本人的第一张牌
                   if(seatlist[i]=='u5')
                   {
                       n1.active=true;
                       n1_scpt.fanPai_do();
                   }
               }
               else if(i<2*n)
               {
                   //发第二轮底牌
                   thiso.fapaiFunc(seatlist[i-n],2);

                   //翻开本人的二张牌
                   if(seatlist[i-n]=='u5')
                   {
                       n2.active=true;
                       n2_scpt.fanPai_do();
                   }
               }
               else{
                   log("i:"+i);
                   clearInterval(ff)
               }
               i++;
           },100)

        }

    },

    handleCallTimer(data){

        let me=this;

        if(data.uid==this.userInfo.uid){

            //
            let btn_g3=cc.find("Canvas/n_btn_footer/n_btn_zidong");
            btn_g3.active=false;

            //如果是当前用户, 显示出叫牌的按钮组;  弃, 跟,加
            let btn_g1=cc.find("Canvas/n_btn_footer/n_btn_gen_qi_jia");
            //跟注按钮, 显示跟的实际金额:
            this.jiazhu_amount=data.jiazhu_amount;


            if (data.jiazhu_amount <= 0) {
                //显示过牌，隐藏跟注
                btn_g1.getChildByName('btn_genzhu').active=false;
                btn_g1.getChildByName('btn_rangpai').active=true;
            }
            else if(data.jiazhu_amount<data.coin)
            {
                btn_g1.getChildByName('btn_rangpai').active=false;
                btn_g1.getChildByName('btn_genzhu').active=true;
                btn_g1.getChildByName('btn_genzhu').getChildByName('lbl_genpai').getComponent(cc.Label).string='跟 '+data.jiazhu_amount;

            }else {
                //显示all in
                btn_g1.getChildByName('btn_rangpai').active=false;
                btn_g1.getChildByName('btn_genzhu').active=true;
                btn_g1.getChildByName('btn_genzhu').getChildByName('lbl_genpai').getComponent(cc.Label).string='全  下';
                this.jiazhu_amount=data.coin;
            }

            //显示操作按钮组的动画； 弃, 跟,加
            btn_g1.x=76;
            btn_g1.y=-60;
            btn_g1.active=true;
            cc.tween(btn_g1)
                .to(0.2,{position:cc.v2(76,115)})
                .call(function () {
                     //下级所有按钮设置为可用状态;
                    me.setChildButtonValid(btn_g1);
                })
                .start();

            //显示: 快捷加注, 大盲的倍数
            let btn_g2=cc.find("Canvas/n_btn_footer/n_btn_kuaijie_jiama_damang");
            btn_g2.x=-486;
            btn_g2.y=-60;
            btn_g2.active=true;

            cc.tween(btn_g2)
                .to(0.2,{position:cc.v2(-486,115)})
                .call(function () {
                    me.setChildButtonValid(btn_g2);
                })
                .start();
        }
        else
        {
            let btn_g1=cc.find("Canvas/n_btn_footer/n_btn_gen_qi_jia");
            btn_g1.active=false;
            let btn_g2=cc.find("Canvas/n_btn_footer/n_btn_kuaijie_jiama_damang");
            btn_g2.active=false;

            //显示: 自动操作, 过或弃, 跟XXX, 跟任何;  //上一个自己是
            if(this.call_seat_no==this.meInfo.seat_no){
                let btn_g3=cc.find("Canvas/n_btn_footer/n_btn_zidong");
                btn_g3.x=-28;
                btn_g3.y=-60;
                btn_g3.active=true;
                cc.tween(btn_g3)
                    .to(0.2,{position:cc.v2(-28,150)})
                    .call(function () {
                    })
                    .start();
            }

        }

        let d=data.duration?data.duration:15;
        //开始倒计时;
        this.startCallTimer(data.seat_no,d);

        if (data.uid==this.userInfo.uid) {
            setTimeout(function () {
                let jiazhu_amount=data.jiazhu_amount;
                //自动操作;
                let auto_flag=this.autoOP;
                log('auto_flag:');
                log(auto_flag);
                switch (parseInt(auto_flag)) {
                    case 1:
                        //让或弃
                        this.hideTimer();
                        if(jiazhu_amount==0){
                            this.btn_click_rangpai();
                        }else {
                            this.btn_click_qipai()
                        }
                        break;
                    case 2:
                        //自动让牌
                        if(jiazhu_amount==0){
                            this.btn_click_rangpai();
                            this.hideTimer();
                        }
                        break;
                    case 3:
                        //跟任何注
                        this.hideTimer();
                        if(jiazhu_amount==0){
                            this.btn_click_rangpai();
                        }
                        else
                        {
                            this.btn_click_genzhu();
                        }

                        break;
                    default:
                        break;
                }
            }.bind(this), 500);
        }



    },

    /**
     * 处理加注指令
     * @param data
     */
    handleGenzhu(wsdata) {

        this.hideTimer();

        let data=wsdata.data;
        let cmd=wsdata.cmd;
        let seat=data.seat_no;

        if (data.uid == this.userInfo.uid) {
            this.meInfo.coin=data.coin;
        }

        let seatname = this.findRealSeat(seat);
        let n_user=cc.find('Canvas/users/'+seatname+'/game_seat');

        if (cmd == 102) {

            this.playAudio_OP(data.sex,'call')

        }
        if (cmd == 109) {

            this.playAudio_OP(data.sex,'check')
            //在对应的用户昵称位置显示 “过牌”；
            this.displayOP(seatname,'rangpai',data.coin)
            return;
        }
        if (cmd == 103) {

            this.playAudio_OP(data.sex,'raise')
            //在对应的用户昵称位置显示 “加注”；
            this.displayOP(seatname,'jiazhu',data.coin)

        }
        if (cmd == 105) {

            this.playAudio_OP(data.sex,'allin')
            //在对应的用户昵称位置显示 “全下”；
            this.displayOP(seatname,'allin',data.coin)

        }
        //播放跟注动画, 显示跟注的小计金额
        let amount=data.sum_amount;
        this.xiaZhuFunc(seatname,amount);
        this.displayOP(seatname,'genzhu',data.coin);

    },

    handleJiazhu(wsdata) {
        this.jiazhu_amount=wsdata.data.sum_amount;
        this.handleGenzhu(wsdata);
    },

    handleAllin(wsdata) {
        this.jiazhu_amount=wsdata.data.sum_amount;
        this.handleGenzhu(wsdata);
    },

    /**
     * 开三张公牌
     * @param data
     */
    handleStepFan(wsdata) {

        let data=wsdata.data;
        let pai = data.pai.split(',');

        //设置未弃牌的用户状态, 把状态改为未操作, 显示昵称, 除了all in的不动;
        let uslist=data.uslist;
        this.initNextStep(uslist);

        //开三张牌
        let cd1=cc.find('Canvas/n_5cards/cd1');
        let cd2=cc.find('Canvas/n_5cards/cd2');
        let cd3=cc.find('Canvas/n_5cards/cd3');

        //开出三张公共牌
        this.kaiPai(cd1,pai[0]);
        setTimeout(this.kaiPai,300,cd2,pai[1]);
        setTimeout(this.kaiPai,600,cd3,pai[2]);


    },


    handleStepZhuan(wsdata) {
        let data=wsdata.data;
        let pai = data.pai;

        //设置未弃牌的用户状态, 把状态改为未操作, 显示昵称, 除了all in的不动;
        let uslist=data.uslist;
        this.initNextStep(uslist);

        let cd4=cc.find('Canvas/n_5cards/cd4');
        //开出三张公共牌
        this.kaiPai(cd4,pai);


    },
    handleStepHe(wsdata) {
        let data=wsdata.data;
        let pai =data.pai;

        //设置未弃牌的用户状态, 把状态改为未操作, 显示昵称, 除了all in的不动;
        let uslist=data.uslist;
        this.initNextStep(uslist);

        let cd5=cc.find('Canvas/n_5cards/cd5');
        //开出三张公共牌
        this.kaiPai(cd5,pai);
    },

    handleShouChouma(data) {

        let user_list=data.data.user_list;
        let sum_chouma=data.data.sum_chouma;
        let seat_no;
        let uid;

        let me=this;
        user_list.forEach((v,i)=>{
            seat_no=v.seat_no;
           // uid=v.uid;
            let seat_name = me.findRealSeat(seat_no);
            me.shouChouma(seat_name);
        })

        //设置筹码金额
        cc.find('Canvas/n_dichi/lbl_dichi_total').getComponent(cc.Label).string=sum_chouma;

    },

    handleQipai(wsdata) {

        let data=wsdata.data;
        this.hideTimer();

        this.playAudio_OP(data.sex,'fold');

        let seat_name = this.findRealSeat(data.seat_no);
        let n_dipai = cc.find('Canvas/users/' + seat_name + '/n_dipai');
        // log(n_dipai);
        let canvas_w_pos = this.node.convertToWorldSpaceAR(cc.v2(0,0));
        let canvas_to_dipai_pos = n_dipai.getChildByName('dipai1').convertToNodeSpaceAR(canvas_w_pos);

        let x=canvas_to_dipai_pos.x;
        let y=canvas_to_dipai_pos.y;

        let scpt = n_dipai.getComponent('ndipai_js');
        scpt.qipai(5,0,x,y);

        this.displayOP(seat_name,'qipai');
        this.setUserInvalid(seat_name);

    },



    /**
     * 显示获胜者，播放收获金动画；
     * @param wsdata
     */
    handleWinner(wsdata){

        let data=wsdata.data;
        if(data.length>1)
        {
            //并列，有边池的情况 todo
            for(let win of data){
                this.winner(win);
            }
        }
        else {
            //获胜者只有一位的情况；
            data = data[0];
            this.winner(data)
        }

    },

    /**
     * 明底牌
     * @param wsdata
     */
    handleMingdipai(wsdata){

        let data=wsdata.data;
        for (let us of data) {
            if (this.meInfo.uid != us.uid) {
                let uname = this.findRealSeat(us.seat_no);
                let dipai=us.dipai.split(',');
                this.mingDipai(uname,dipai);
                this.hideDipai(uname)
            }
        }

    },

    /**
     *
     * @param wsdata
     */
    handleYuEBuzhu(wsdata) {
        let data=wsdata.data;
        let us_l=data.invalid_usl;

    },

    /**
     *
     * @param wsdata
     */
    handleStopGame(wsdata){
        let data=wsdata.data;
        this.resetGame(data);

        //显示开始按钮;
        cc.find('Canvas/btn_start').active=true;

    },


    /**
     * 游戏结束
     * @param wsdata
     */
    handleWinner2(wsdata) {
        let data=wsdata.data;

        if (this.userInfo.uid == data.uid) {
           cc.audioEngine.play(this.audio_shouchouma, false, 1);
           let audio_win= this.audio_winner
            setTimeout(()=>{
                cc.audioEngine.play(audio_win, false, 1);
            },1500)

        }
        else {
            cc.audioEngine.play(this.audio_lose, false, 1);
        }


        let uname = this.findRealSeat(data.seat_no);
        let user_coin=data.coin;
        let amount=data.amount;
        this.fenpeiDichi(uname,amount,user_coin);
    },

    /**
     * 新的牌局准备
     */
    handleRestartGame(wsdata) {
        let data=wsdata.data;
       this.resetGame(data);

    },

    handleExitGame(wsdata){
        let data=wsdata.data;
        let seat_no=data.seat_no;
        let seat_name = this.findRealSeat(seat_no);

        this.hideSeat(seat_name);

        if(data.uid==this.userInfo.uid){
            //如果是当前用户, 退出到大厅
            cc.director.loadScene('hall');
        }

    },

    hideSeat(seat_name) {
        cc.find('Canvas/users/'+seat_name).active=false;
    },

    resetGame(data) {
        let uslist=data.uslist;

        //隐藏公共牌
        this.n_5card.children.forEach((v,i)=>{
            v.active=false;
        })

        for (let item of uslist) {

            let seat_name=this.findRealSeat(item.seat_no);

            //隐藏各用户的操作状态, 显示昵称, 显示明亮色, 隐藏获胜者的'+金额', 隐藏d位, 投注栏,
            this.users.getChildByName(seat_name).getChildByName('D').active = false;
            this.users.getChildByName(seat_name).getChildByName('pre_genzhu').active = false;
            this.users.getChildByName(seat_name).getChildByName('game_seat').getChildByName('lbl_wincoin').active=false;
            this.users.getChildByName(seat_name).getChildByName('game_seat').getChildByName('n_winouter').active=false;
            this.users.getChildByName(seat_name).getChildByName('game_seat').getChildByName('n_mingpai').active=false;
            cc.find('Canvas/users/'+seat_name+'/n_dipai').active=false;
            this.setUserValid(seat_name);
            this.displayNickname(seat_name);


        }

        // 隐藏当前用户的底牌
        cc.find('Canvas/users/u5/dipai01').active=false;
        cc.find('Canvas/users/u5/dipai02').active=false;


        //显示等待开始
        this.lbl_waiting.y = 10;
        this.lbl_waiting.active=true;
    },

    winner(data) {
        //自已获胜,或失败的声音效果
        if(this.userInfo.uid == data.uid) {
            cc.audioEngine.play(this.audio_shouchouma, false, 1);
            let audio_win= this.audio_winner
            setTimeout(()=>{
                cc.audioEngine.play(audio_win, false, 1);
            },1500)

        }
        else {
            cc.audioEngine.play(this.audio_lose, false, 1);
        }


        let uname = this.findRealSeat(data.seat_no);
        log("uname:"+uname)
        let amount=data.amount;
        let user_coin=data.coin;

        //打开底牌
        let dipai=data['dipai'].split(',');
        if (uname != 'u5') {
            this.mingDipai(uname, dipai);
        }

        //显示牌型
        if(data.pai_name!='高牌')
        {
            this.displayOP(uname, 'painame',-1,data.pai_name);
        }


        // 显示金色框， 收底池筹码动画；
        this.fenpeiDichi(uname,amount,user_coin);
    },

    mingDipai(uname, dipai) {
        let c1=cc.find('Canvas/users/'+uname+'/game_seat/n_mingpai/c1');
        cc.loader.loadRes('poker/c'+dipai[0], cc.SpriteFrame,function (err, sptF) {
            c1.getComponent(cc.Sprite).spriteFrame=sptF;
            c1.active=true;
            c1.parent.active=true;
        })

        let c2=cc.find('Canvas/users/'+uname+'/game_seat/n_mingpai/c2');
        cc.loader.loadRes('poker/c'+dipai[1], cc.SpriteFrame,function (err, sptF) {
            c2.getComponent(cc.Sprite).spriteFrame=sptF;
            c2.active=true;
            c2.parent.active=true;
        })
    },

    /**
     * 把底池分配给胜者的界面显示效果
     * @param real_seat
     */
    fenpeiDichi(real_seat, winAmount, user_coin) {

        let uname=real_seat;
        // 显示金色框， 收底池筹码动画；
        let n_win_outer=cc.find('Canvas/users/'+uname+'/game_seat/n_winouter');
        n_win_outer.active=true;

        //底池金额减掉分配的;
        let di_chi=cc.find('Canvas/n_dichi');
        let dichi_total=di_chi.getChildByName('lbl_dichi_total').getComponent(cc.Label).string;
        dichi_total-=winAmount;
        di_chi.getChildByName('lbl_dichi_total').getComponent(cc.Label).string = dichi_total;

        this.move_chouma_to_user(uname,'cm01');
        setTimeout(this.move_chouma_to_user.bind(this),200,uname,'cm02');
        setTimeout(this.move_chouma_to_user.bind(this),400,uname,'cm03');

        //
        let lbl_win_coin=cc.find('Canvas/users/'+uname+'/game_seat/lbl_wincoin');
        let lbl_coin=    cc.find('Canvas/users/'+uname+'/game_seat/lbl_coin').getComponent(cc.Label);
        // console.log("out lbl_coin:");
        // console.log(lbl_coin);

        lbl_win_coin.scaleX=0.3;
        lbl_win_coin.scaleY=0.3;
        lbl_win_coin.position = cc.v2(0, 0);
        lbl_win_coin.getComponent(cc.Label).string='+ '+winAmount;
        lbl_win_coin.active=true;
        cc.tween(lbl_win_coin)
            .to(1,{position:cc.v2(0,120),scale:1})
            .call(function () {
                // console.log('lbl_coin:'+user_coin);
                lbl_coin.string=user_coin;
                // console.log(lbl_coin);
            })
            // .to(3,{opacity:0})
            .start();
    },


    /**
     * 底池 筹码移动到用户的动画
     * @param u_seatname
     * @param cm_n
     * @param callback
     */
    move_chouma_to_user(u_seatname,cm_n,callback=null) {
        let cm01 = cc.find('Canvas/n_dichi/'+cm_n);
        cm01.x=0;
        cm01.y=-20;

        let u5 = cc.find('Canvas/users/'+u_seatname);
        let u5_w_pos = u5.convertToWorldSpaceAR(cc.v2(0,0)); //将u5节点的 0,0 转成世界坐标；
        let u5_to_cm01_pos = cm01.convertToNodeSpaceAR(u5_w_pos);  //将u5的世界坐标， 转为 cm01的坐标系中的位置；
        // console.log(u5_to_cm01_pos);
        cm01.active=true;


        cc.tween(cm01)
            .to(0.2,{position:u5_to_cm01_pos})
            .call(function () {
                cm01.active=false;
            })
            .start();
    },

    /**************** handle end *************/

    /**
     * 根据用户的seat_no,算出界面上的座位; 返回节点名称;
     * @param seat_no
     * @returns {string}
     */
    findRealSeat(seat_no){
        let me_seatno=this.meInfo.seat_no;
        let real_seat;
        if(seat_no<this.meInfo.seat_no){
            real_seat=(9+seat_no-me_seatno)+5;
        }
        else
        {
            real_seat=(seat_no-me_seatno)+5;
        }

        if (real_seat>9)
        {
            real_seat=real_seat%9;
        }

       return  'u'+real_seat;
    },

    hideReadyInfo(real_seat){
        cc.find("Canvas/users/"+real_seat+"/game_seat/u_head/h_ready").active=false;
        cc.find("Canvas/users/"+real_seat+"/game_seat/u_head/lbl_ready").active=false;
    },

    /**
     * 显用头像灰色
     * @param real_seat
     */
    setUserInvalid(real_seat) {
        //隐藏底牌
        this.hideDipai(real_seat);

        //隐藏操作名,
        this.displayNickname(real_seat);

        //隐藏跟注;
        this.hideGenzhu(real_seat);

        //隐藏明牌
        this.hideMingpai(real_seat);

        //显示灰色
        cc.find("Canvas/users/"+real_seat+"/game_seat/u_head/h_ready").active=true;
    },

    /**
     * 去掉头像灰色
     * @param real_seat
     */
    setUserValid(real_seat) {
        cc.find("Canvas/users/"+real_seat+"/game_seat/u_head/h_ready").active=false;
    },

    hideGenzhu(real_seat) {
        cc.find("Canvas/users/"+real_seat+"/pre_genzhu").active=false;
    },

    hideDipai(real_seat) {
        cc.find("Canvas/users/"+real_seat+"/n_dipai").active=false;
    },

    hideMingpai(real_seat) {
        cc.find("Canvas/users/"+real_seat+"/game_seat/n_mingpai").active=false;
    },

    hideU5Dipai() {
        cc.find("Canvas/users/u5/n_dipai").active=false;
        cc.find("Canvas/users/u5/dipai01").active=false;
        cc.find("Canvas/users/u5/dipai02").active=false;
    },


    sitdown(data)
    {
        //计算出座位:
        let n_seat = this.findRealSeat(data.seat_no);

        //如果状态是已经开始, 隐藏掉"准备"信息
        if(data.status==1){
            this.hideReadyInfo(n_seat);
        }

        // console.log(data);

        cc.find("Canvas/users/"+n_seat+"/game_seat/lbl_nickname").getComponent(cc.Label).string=data.nick_name;
        cc.find("Canvas/users/"+n_seat+"/game_seat/lbl_coin").getComponent(cc.Label).string=data.coin;
        //设置头像
        let un=cc.find("Canvas/users/"+n_seat+"/game_seat/u_head/avater5").getComponent(cc.Sprite);
        cc.loader.loadRes('role/'+data.headimg, cc.SpriteFrame,function (err, sptF) {
            un.spriteFrame=sptF;
        });
        cc.find("Canvas/users/"+n_seat).active=true;
    },

    /**
     * 点击开始
     */
    btn_click_start(e,d){
        let sendData=mkData(101,"开始");
        ws.send(sendData);
    },



    /**
     * 弃牌
     */
    btn_click_qipai(e,d) {

        this.setOpButtonInvalid()

        let seatno=this.meInfo.seat_no;
        let sendData=mkData(104, "弃牌",{seat_no:seatno});
        log(sendData)
        ws.send(sendData);

    },

    /**
     * 发送跟注的操作指令
     */
    btn_click_genzhu(e,d) {
        this.setOpButtonInvalid()

        let amount=this.jiazhu_amount;
        let seatno=this.meInfo.seat_no;
        let sendData=mkData(102, "跟注",{seat_no:seatno,amount:amount});

        //如果跟注金额和余额相同, 那么就是全下;
        if (amount == this.meInfo.coin) {
            sendData=mkData(105, "全下",{seat_no:seatno,amount:amount});
        }

        // log(sendData)
        ws.send(sendData);

    },

    /**
     * 让牌
     */
    btn_click_rangpai(e,d){

        this.setOpButtonInvalid()

        let amount=this.jiazhu_amount;
        let seatno=this.meInfo.seat_no;
        let sendData=mkData(109, "让牌",{seat_no:seatno,amount:amount});
        log(sendData)
        ws.send(sendData);
    },

    btn_click_jiazhu() {

        //隐藏操作按钮组;
        this.hideOpGroup();


        /**计算加注数据,显示加注按钮组; 动画;
         *
         */

        //计算数据
        let jiazhu_amount=this.jiazhu_amount;
        let xm_v=this.xm_v;


        //显示出来;
        this.showJiazhuPannel();


    },

    /**
     * 确认加注
     */
    btn_click_jiazhuPannel_sure(){
        this.setOpButtonInvalid()
        this.hideJiazhuPannel();
        //加注金额
        let amount= cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string;
        let seatno=this.meInfo.seat_no;
        let user_balance=this.meInfo.coin;
        let cmd=103;
        let cmd_msg = '加注';

        if (parseInt(amount) == parseInt(user_balance)) {
            cmd=105; //all in
            cmd_msg = '全下';
        }
        let sendData=mkData(cmd, cmd_msg,{seat_no:seatno,amount:amount});
        ws.send(sendData);
    },

    btn_click_jiazhuPannel_cannel(){

        this.hideJiazhuPannel();
        this.showOpGroup();

    },

    /**
     * 加大盲注按钮
     */
    btn_click_jiamangzhu(e,args){
        let bs = parseInt(args);
        let damang=2*this.roomInfo.xm_v;
        let amount=bs*damang;

        cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string=amount;

        this.btn_click_jiazhuPannel_sure();


    },

    btn_click_test() {
        // this.fapaiFunc("u1",1);
        // let me=this;
        // setTimeout(function () {
        //     me.fapaiFunc("u1",2);
        // },100)

        // this.test_timer();

        this.handleWinner(null);

    },

    btn_click_add() {
        let xm_v=this.roomInfo['xm_v'];
        let user_balance=this.meInfo.coin;

        let c_amount= cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string;
        let new_amount=parseInt(c_amount)+xm_v;

        log(c_amount);
        log(new_amount);

        if (new_amount > user_balance) {
            new_amount=user_balance;
        }

        cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string=new_amount;

    },

    btn_click_minus() {
        let xm_v=this.roomInfo['xm_v'];
        let genzhu_v=this.jiazhu_amount;


        let c_amount= cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string;
        let new_amount=c_amount-xm_v;

        if (new_amount < genzhu_v+xm_v) {
            new_amount=genzhu_v+xm_v;
        }

        cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string=new_amount;
    },

    btn_click_allin() {
        let user_balance=this.meInfo.coin;
        cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string=user_balance;
    },

    btn_click_setThisValue(e,args) {
        let thisbtn_lbl = e.target.getChildByName('Background').getChildByName('Label').getComponent(cc.Label);
        console.log(thisbtn_lbl.string);
        cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string=thisbtn_lbl.string;
    },


    /**
     * 保存自动操作的参数
     * @param e
     * @param args
     */
    btn_toggle_container(e,args) {

        if (args) {
            this.autoOP=args;
        }

    },

    /**
     * 退出游戏
     */
    btn_click_exitGame() {

        //发送退出房间命令
        let sd=mkData(12,'退出房间',{uid:this.meInfo.uid});
        ws.send(sd);

    },

    /**
     * 叫牌倒计时函数,
     * @param real_seat 座位号
     * @param duration 时长
     */
    startCallTimer(seat_no,duration=20){


        //停止和隐藏上一位的倒计时动画;
        if (this.call_seat_no == -1) {
            this.call_seat_no= seat_no;
        } else {
            let pre_seat = this.call_seat_no;
            this.call_seat_no = seat_no;

            let pre_real_seat = this.findRealSeat(pre_seat);
            let pre_ntimer = cc.find("Canvas/users/" + pre_real_seat + "/game_seat/user_counter");

            if (this.timerTween != null) {
                this.timerTween.stop();
            }

            pre_ntimer.getComponent(cc.ProgressBar).progress = 0;

        }


        let real_seat=this.findRealSeat(seat_no);
        let n_timer= cc.find("Canvas/users/"+real_seat+"/game_seat/user_counter");
        this.c_n_timer=n_timer;
        n_timer.active=true;

        let me=this;
        let jiazhu_amount=this.jiazhu_amount;
       this.timerTween= cc.tween(n_timer.getComponent(cc.ProgressBar))
            .to(duration,{progress:1},)
            .call(function () {
                log('timer end');

                if(seat_no==me.meInfo.seat_no){
                    //当前用倒计时的是自已, 时间到时自动让或弃
                    if(jiazhu_amount==0){
                        me.btn_click_rangpai();
                    }else {
                        me.btn_click_qipai()
                    }
                }

            })
            .start();
    },

    test_timer() {
        real_seat='u5';
        this.startCallTimer(real_seat,10)
    },

    test_fapai() {
        this.userInfo.uid=2;
        this.meInfo.seat_no=2;
        let data={uid:2,dipai:[5,20],userlist:[{uid:8,seat_no:5},{uid:8,seat_no:6},{uid:2,seat_no:2},{uid:1,seat_no:3},{uid:3,seat_no:0},{uid:5,seat_no:4},{uid:5,seat_no:8},{uid:5,seat_no:7}]}
        this.handleDipai(data)
    },

    create_node_dipai(n_parent){
        cc.loader.loadRes('prefab/winAlert',function(err,prefab){
            let alert_node=cc.instantiate(prefab);
            let alertscript=alert_node.getComponent("WinAlertScript")
            alertscript.setTip('动态加载了，厉害吗？')
            n_parent.node.addChild(alert_node)
        })
    },

    setDSeat(r_seat_no) {

        //将上一次的D位,隐藏
        if (this.n_dseat != null) {
            this.n_dseat.active=false;

        }

        //显示新的D位;
        this.n_dseat=cc.find('Canvas/users/'+r_seat_no+'/D');
        this.n_dseat.active=true;
    },

    /**
     * 给别的玩家发底牌的动画效果
     * @param seatname
     * @param flag
     */
    fapaiFunc(seatname,flag){
        let u_n=cc.find('Canvas/users/'+seatname);
        // console.log(seatname);

        let n_dipai=u_n.getChildByName('n_dipai');
        let fapai_spt=n_dipai.getComponent('ndipai_js');
        let x1=u_n.x+n_dipai.x;
        let y1=u_n.y+n_dipai.y-100;
        n_dipai.active=true;

        if(flag==1){
            fapai_spt.fapai1(-x1,-y1,0,0);
        }
        else{
            fapai_spt.fapai2(-x1,-y1,10,-1);
        }

    },


    /**
     * 下注动画效果
     * @param seatname 界面上的座位名称
     * @param money 加完注的总金额
     */
    xiaZhuFunc(seatname,money){
        let u_n=cc.find('Canvas/users/'+seatname);
        // console.log(seatname);
        let pre_genzhu=u_n.getChildByName('pre_genzhu');
        let spt=pre_genzhu.getComponent('genzhu_js');
        let x1=-pre_genzhu.x;
        let y1=-pre_genzhu.y;
        log(x1+','+y1)
        pre_genzhu.active=true;

        spt.setMoney(money);
        spt.xiazhu(x1,y1,66,1);
    },

    shouChouma(seatname){
        log('shou chou ma!')
        let u_n=cc.find('Canvas/users/'+seatname);

        let n_dichi = cc.find('Canvas/n_dichi');

        let pre_genzhu=u_n.getChildByName('pre_genzhu');

        //计算出终点坐标;  需要转到同一坐标系下面;
        let x_dichi_un=n_dichi.x-u_n.x;
        let y_dichi_un=n_dichi.y-u_n.y;

        let x=x_dichi_un-pre_genzhu.x;
        let y=y_dichi_un-pre_genzhu.y;

        let spt=pre_genzhu.getComponent('genzhu_js');

        spt.chouMa2Dichi(x,y);
    },


    /**
     * 在用户昵称的位置， 显示用户的操作
     * @param seatname
     * @param code
     */
    displayOP(seatname, code,coin=-1,text=null) {
        let n_user=cc.find('Canvas/users/'+seatname+'/game_seat');
        let n_op = n_user.getChildByName('n_op');

        //隐藏其他的操作名称
        n_op.children.forEach((v, i)=>{
            v.active=false;
        });

        //隐藏昵称
        n_user.getChildByName('lbl_nickname').active=false;

        //更新余额
        if (coin > -1) {
            n_user.getChildByName('lbl_coin').getComponent(cc.Label).string=coin;
        }


        let nn='op_'+code;
        console.log(nn);
        // console.log(n_op)
        let tn= n_op.getChildByName(nn);
        if (text != null) {
            tn.getComponent(cc.Label).string=text;
            log(text);
        }
        tn.active=true; //显示本次的操作名称；
    },

    displayNickname(seatname) {
        let n_user=cc.find('Canvas/users/'+seatname+'/game_seat');
        let n_op = n_user.getChildByName('n_op');

        //隐藏其他的操作名称
        n_op.children.forEach((v, i)=>{
            v.active=false;
        });

        //隐藏昵称
        n_user.getChildByName('lbl_nickname').active=true;
    },

    kaiPai(node_pai, value) {
        let  cd1=node_pai;
        let cd1_scpt=cd1.getComponent('fanpai_js');
        cd1_scpt.setPaiValue(value);
        cc.loader.loadRes('poker/cb', cc.SpriteFrame,function (err, sptF) {
            cd1.getComponent(cc.Sprite).spriteFrame=sptF;
        })
        cd1.active=true;
        cd1_scpt.fanPai_do();
    },

    /**
     * 隐藏当前的用户倒计时
     */
    hideTimer() {
        if (this.timerTween != null) {
            this.timerTween.stop();
            this.c_n_timer.active=false;
        }
    },

    setOpButtonInvalid() {
        let btn_g1=cc.find('Canvas/n_btn_footer/n_btn_gen_qi_jia');
        let btn_g2 = cc.find('Canvas/n_btn_footer/n_btn_kuaijie_jiama_damang');
        this.setChildButtonInvalid(btn_g1);
        this.setChildButtonInvalid(btn_g2);

    },
    setChildButtonInvalid(btn_group) {
        let btns=btn_group.children;
        // log(btns)

        for (let item of btns) {
            let btn= item.getComponent(cc.Button);
            // log(btn)
            btn.interactable=false;
        }
    },

    setChildButtonValid(btn_group) {
        let btns=btn_group.children;
        // log(btns)

        for (let item of btns) {
           let btn= item.getComponent(cc.Button);
           // log(btn)
           btn.interactable=true;
        }
    },

    /**
     * 显前叫牌的操作按钮
     */
    showOpGroup() {
        //显示操作按钮组的动画； 弃, 跟,加
        let btn_g1=cc.find("Canvas/n_btn_footer/n_btn_gen_qi_jia");
        let me=this;
        btn_g1.x=76;
        btn_g1.y=-60;
        btn_g1.active=true;
        cc.tween(btn_g1)
            .to(0.2,{position:cc.v2(76,115)})
            .call(function () {
                //下级所有按钮设置为可用状态;
                me.setChildButtonValid(btn_g1);
            })
            .start();

        //显示: 快捷加注, 大盲的倍数
        let btn_g2=cc.find("Canvas/n_btn_footer/n_btn_kuaijie_jiama_damang");
        btn_g2.x=-486;
        btn_g2.y=-60;
        btn_g2.active=true;

        cc.tween(btn_g2)
            .to(0.2,{position:cc.v2(-486,115)})
            .call(function () {
                me.setChildButtonValid(btn_g2);
            })
            .start();
    },

    /**
     * 隐藏叫牌的操作按钮
     */
    hideOpGroup() {

        let btn_g1=cc.find("Canvas/n_btn_footer/n_btn_gen_qi_jia");
        //显示操作按钮组的动画； 弃, 跟,加
        this.setChildButtonInvalid(btn_g1);
        cc.tween(btn_g1)
            .to(0.2,{position:cc.v2(76,-60)})
            .call(function () {
                //下级所有按钮设置为可用状态;
                btn_g1.active=false;
            })
            .start();

        //显示: 快捷加注, 大盲的倍数
        let btn_g2=cc.find("Canvas/n_btn_footer/n_btn_kuaijie_jiama_damang");
        this.setChildButtonInvalid(btn_g2);
        cc.tween(btn_g2)
            .to(0.2,{position:cc.v2(-486,-60)})
            .call(function () {
                btn_g2.active=false;
            })
            .start();
    },

    /**
     * 显示加注面板
     */
    showJiazhuPannel() {
        let btn_g1=cc.find('Canvas/n_jiazhu_pannel');
        btn_g1.x=243;
        btn_g1.y=-426;
        btn_g1.active=true;

        //计算数据
        let xm_v=this.roomInfo['xm_v'];
        let genzhu_v=this.jiazhu_amount;
        let user_balance=this.meInfo.coin;

        // log(this.roomInfo);

        log(xm_v);
        log(genzhu_v);
        log(user_balance);


        let btn_amount_value=0;
        let beishu=[1,2,3,5,10,20]; //倍数

        //先隐按钮
        for (let i = 0; i < 6; i++) {
            cc.find('Canvas/n_jiazhu_pannel/btn_'+beishu[i]+'x').active=false;
        }


        //计算每个按钮的金额;
        for (let i=0;i<6;i++) {
            btn_amount_value=genzhu_v+xm_v*beishu[i];
            if (btn_amount_value > user_balance.coin) {
                break;
            }
            cc.find('Canvas/n_jiazhu_pannel/btn_'+beishu[i]+'x/Background/Label').getComponent(cc.Label).string=btn_amount_value;
            cc.find('Canvas/n_jiazhu_pannel/btn_'+beishu[i]+'x').active=true;
        }


        //加注金额默认为第一个按钮的值;
        cc.find('Canvas/n_jiazhu_pannel/lbl_amount').getComponent(cc.Label).string=genzhu_v+xm_v;


        //显示按钮组动画;
        let me=this;
        cc.tween(btn_g1)
            .to(0.3,{position:cc.v2(243,-326)})
            .call(function () {

            })
            .start();
    },



    /**
     * 隐藏加注面板
     */
    hideJiazhuPannel() {
        let btn_g1=cc.find('Canvas/n_jiazhu_pannel');

        let me=this;
        cc.tween(btn_g1)
            .to(0.3,{position:cc.v2(243,-426)})
            .call(function () {
                btn_g1.active=false;
            })
            .start();
    },


    setUserCoin(seatname,coin) {
        let n_user=cc.find('Canvas/users/'+seatname+'/game_seat');

        //更新余额
        if (seatname == 'u5') {
            this.meInfo.coin=coin;
        }

        if (coin > -1) {
            n_user.getChildByName('lbl_coin').getComponent(cc.Label).string=coin;
        }
    },

    playAudio_OP(sex,audio_name) {

        let audio_clip;
        if (sex == 1) {
            audio_clip=this[audio_name+'_boy'];
            cc.audioEngine.play(audio_clip, false, 1);
        }else{
            audio_clip=this[audio_name+'_girl'];
            cc.audioEngine.play(audio_clip, false, 1);
        }
    },
    btn_open_history_dialog() {

        let dialog=cc.find('Canvas/n_dialog_history');

        //显示历史数据
        this.setHistoryData()


        dialog.active=true;
        dialog.position=cc.v2(0,730)
        cc.tween(dialog)
            .to(0.2,{position:cc.v2(0,0)})
            .start()
    },

    btn_close_history_dialog(){
        let dialog=cc.find('Canvas/n_dialog_history');
        dialog.active=false;

    },

    /**
     * 显示历史数据
     */
    setHistoryData() {
        let user=JSON.parse(localStorage.getItem('userInfo'));
        let uid=user.uid;
        let rid= cc.ut.enterRoomArgs.rid;


        //取最近三期的历史数据
        cc.ut.http2.sendRequest("/game/ghistory",{rid:rid,uid:uid},function (rs) {
            console.log("rs:")
            console.log(rs);
            if(rs && rs.code==1){
                let data=rs.data;
                for (let i=0;i<data.length;i++) {
                    let hn=i+1;
                    this.setOneHistory('n_h'+hn.toString(), data[i]);
                }

            }
            else{
                //todo 用提示框提示信息;
                this.hideHistoryData()
                console.log('服务器错误!')
            }
        }.bind(this))

    },
    hideHistoryData() {
        cc.find('Canvas/n_dialog_history/n_h1').active=false;
        cc.find('Canvas/n_dialog_history/n_h2').active=false;
        cc.find('Canvas/n_dialog_history/n_h3').active=false;
    },

    // 一条历史记录
    setOneHistory(nd_name, data) {


        let c0 = cc.find('Canvas/n_dialog_history/'+nd_name+'/c0');
        let c1 = cc.find('Canvas/n_dialog_history/'+nd_name+'/c1');
        let c2 = cc.find('Canvas/n_dialog_history/'+nd_name+'/c2');
        let c3= cc.find('Canvas/n_dialog_history/'+nd_name+'/c3');
        let c4= cc.find('Canvas/n_dialog_history/'+nd_name+'/c4');

        let w1= cc.find('Canvas/n_dialog_history/'+nd_name+'/w1');
        let w2= cc.find('Canvas/n_dialog_history/'+nd_name+'/w2');


        let m1= cc.find('Canvas/n_dialog_history/'+nd_name+'/m1');
        let m2= cc.find('Canvas/n_dialog_history/'+nd_name+'/m2');

        let win_icon= cc.find('Canvas/n_dialog_history/'+nd_name+'/n_icon_win');
        //5张公共牌
        this.setHistory_pai(c0,data.poker_pub[0]);
        this.setHistory_pai(c1,data.poker_pub[1]);
        this.setHistory_pai(c2,data.poker_pub[2]);
        this.setHistory_pai(c3,data.poker_pub[3]);
        this.setHistory_pai(c4,data.poker_pub[4]);

        //win的底牌
        if (data.win_pai != null) {
            this.setHistory_pai(w1,data.win_pai[0]);
            this.setHistory_pai(w2,data.win_pai[1]);
        }

        //我的底牌
        this.setHistory_pai(m1,data.me_pai[0]);
        this.setHistory_pai(m2,data.me_pai[1]);

        //积分变动
        cc.find('Canvas/n_dialog_history/'+nd_name+'/lbl_wincoin').getComponent(cc.Label).string=data.amount;
        if(data.amount>0){
            //显示win icon
            win_icon.active=true;
        }
        else
        {
            win_icon.active=false;
        }

        cc.find('Canvas/n_dialog_history/'+nd_name).active=true;

    },

    setHistory_pai(nd, pai) {

        log('pai:'+pai);
        cc.loader.loadRes('poker/c'+pai, cc.SpriteFrame,function (err, sptF) {
            nd.getComponent(cc.Sprite).spriteFrame=sptF;
            nd.active=true;
            nd.parent.active=true;
        })
    }




});
