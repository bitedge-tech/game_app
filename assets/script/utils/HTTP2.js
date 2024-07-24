// const URL ='http://127.0.0.1:8000';
	
const URL ='http://192.168.3.217:8000';
// const URL ='http://192.168.0.100:8000';
// const URL ='http://119.3.157.25:8000';

let HTTP = cc.Class({
    extends: cc.Component,

    statics: {
        sessionId: 0,
        userId: 0,
        master_url: URL,
        url: URL,
        sendRequest: function (path, fdata, handler) {

                let xhr = cc.loader.getXMLHttpRequest();
                let requestURL=URL+path;
                console.log(requestURL);
                xhr.timeout = 3000;
                let data= new FormData();

                for(let k in fdata){
                   data.append(k,fdata[k]);
                }
                // data=new FormData();
                // data.append("a",'1111')

                xhr.ontimeout=function(e){
                    console.log("time out!")
                }

                xhr.onload = function () {
                    if (xhr.readyState !== 4) {
                        return;
                    }
                    
                    if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                        console.log("http res(" + xhr.responseText.length + "):" + xhr.responseText);
                        try {
                            let ret = JSON.parse(xhr.responseText);
                            if (handler !== null) {
                                handler(ret);
                            }                        /* code */
                        } catch (e) {
                            console.log("err:" + e);
                            handler(null);
                        } finally {

                        }
                    }
                };

                xhr.onerror=function (e) {
                    console.log("net err:" + JSON.stringify(e));
                    handler(null);
                }

                try{
                    xhr.open("post", requestURL);
                    // xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                    xhr.send(data);
                    return xhr;
                }
                catch (e) {
                    console.log("err:" + e);
                    handler(null);
                }

        },
    },
});