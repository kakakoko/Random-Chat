var fs = require('fs');
var path = require('path');
var url = require('url');

//创建onlineUser,userKey,userValue,userJson的数组和
var onlineUsers = [];
var userKey = [];
var userValue = [];
var userJson = [];
var threeUsers = [];

//分隔符
var separator = "AND";
var PORT = 30001;
//乱码
var NOT_FOUNT_MSG = '卡卡提醒您：404 了！';
//创建服务器
var app = require('http').createServer(router);
var io = require('socket.io')(app);
app.listen(PORT, function () {
    console.log('run at: http://127.0.0.1:' + PORT);
});

//读取文件方法
function get_file_content(filepath) {
    return fs.readFileSync(filepath);
}

/*路由器
准备一个html文件让客户端连接域名时使用*/
function router(req, res) {
    if (req.url === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html;charset=utf-8'
        });
        res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    }
    else if (req.url.substr(req.url.length - 4, req.url.length) === 'e.js') {
        res.writeHead(200, {'Content-Type': 'text/javascript'});
        /*        res.end(get_file_content('../../../../ubuntu/node_modules/lrz/dist/lrz.all.bundle.js'));*/
        res.end(get_file_content('../lrz/dist/lrz.all.bundle.js'));
    }
    else if (req.url.substr(req.url.length - 4, req.url.length) === '.jpg') {
        res.writeHead(200, {'Content-Type': 'image/jpeg'});
        res.end(get_file_content('./public/imgs/2.jpg'));
        /*  res.end();*/
    }
    else {
        res.end(NOT_FOUNT_MSG);
    }
}
//启动connction响应函数，用于响应客户端的连接信息
io.on('connection', function (socket) {
    //启动createUser响应函数，用于响应客户端创建用户名
    socket.on('createUser', function (data){
        var userName = data.userName;

        //把新连接的用户信息存到onlineUser
        onlineUsers.push(userName);

        //启动broadcast广播函数，用于广播新连接用户信息给各个客户端广播函数
        io.emit('broadcast', {
            userName: userName
        });
        console.log(userName);
    });
    //启动pm响应函数，用于接收客户端的私聊信息
    socket.on('pm', function (data) {
        if (data.targetName.indexOf(separator) != -1){
            console.log('separator:'+separator);
            console.log(data.targetName);
        }
        io.emit('pm', {
            msg:data.msg,
            userName:data.userName,
            targetName:data.targetName,
            isPicture:data.isPicture,
            img01:data.img01
        });
    });

})
//每30秒调用一次
var RANDOM_DELTA = 30*1000;
//检测onlineUser的人数
var interval02 = setInterval(function () {
    if (onlineUsers.length < 2){
        console.log('people not enough ')
        return;
    }
    else{
        if (onlineUsers.length == 2){
            //2人分配
            console.log('2人分配');
            evenMatch(onlineUsers,userKey,userValue,userJson);
            return;
        }
        else if (onlineUsers.length == 3){
            //3人分配
            console.log('3人分配');
            unevenMatch(onlineUsers,threeUsers);
            onlineUsers.splice(0, onlineUsers.length);
            return;
        }
        else if (onlineUsers.length >2 && onlineUsers.length % 2 == 0){
            //2人以上偶数分配
            console.log('2人以上偶数分配');
            evenMatch(onlineUsers,userKey,userValue,userJson);
            return;
        }
        else{
            //3人分配后偶数分配
            console.log('3人分配后偶数分配');
            unevenMatch(onlineUsers,threeUsers);
            evenMatch(onlineUsers,userKey,userValue,userJson);
            return;
        }
    }
},RANDOM_DELTA)
//把一个数组的值随机分配到两个数组里
function toTwoArray(arrSum, arrKey, arrValue) {
    for(var i=0; arrSum.length!=0; i++){
        arrKey[i] = arrSum[0];
        arrSum.shift();
        var n = Math.floor(Math.random() * arrSum.length + 1)-1;
        arrValue[i] = arrSum[n];
        arrSum.splice(n,1);
    }
}
//把两个数组的值合并成键值对到一个json数组
function toJson(arrKey, arrValue, arrJson) {
    for(var i=0;i<arrKey.length;i++){
        var key=arrKey[i];
        var val=arrValue[i];
        var obj={};
        obj[key]=val;
        arrJson.push(obj)
    }
}
function evenMatch(onlineUsers,userKey,userValue,userJson) {
    //把userOnine数组的值随机分配到userKey,userValue两个数组里
    toTwoArray(onlineUsers,userKey,userValue);
    //把userKey,userValue数组的值合并成键值对到userJson数组
    toJson(userKey,userValue,userJson);
    //打印userJson
    for(var i=0;i<userJson.length;i++){
        for(var key in userJson[i]){
            console.log(key+':'+userJson[i][key]);
        }
    }
    io.emit('randomChat', {
        userJson:userJson,
        threeUsers:['1a!.A','1a!.A','1a!.A']
    });

    onlineUsers.splice(0, onlineUsers.length);
    userKey.splice(0, userKey.length);
    userValue.splice(0, userValue.length);
    userJson.splice(0, userJson.length);
}
//随机抽取onlineUsers的3个对象放到threeUers里
function unevenMatch(onlineUsers,threeUers) {
    for (var i=0; i<3; i++){
        var n = Math.floor(Math.random() * onlineUsers.length + 1)-1;
        var value = onlineUsers[n];
        threeUers.push(value)
        onlineUsers.splice(n,1);
    }
    io.emit('randomChat', {
        userJson:userJson,
        threeUsers:threeUers
    });
    //打印threeUsers
    console.log('threeUsers['+threeUers[0]+','+threeUers[1]+','+threeUers[2]+']');
    threeUers.splice(0, threeUers.length);
}

