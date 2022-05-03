// --- 資料庫連線的準備 ---
const Mongo = require("mongodb");
// Mongodb > Database > Cluster0 > connect > connect your application
const uri = "mongodb+srv://root:root123@cluster0.wbbdz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new Mongo.MongoClient(uri)
let db = null // null 代表尚未連線成功
client.connect(async function(err) {
    if(err) {
        console.log("資料庫連線失敗", err);
        return
    }

    // 連線成功後，取得資料庫物件供後續使用
    db = client.db("nodeJsApp")
    console.log("資料庫連線成功")
})

// ---- 建立網站伺服器基礎設定 ----
const express = require("express");
const app = express();

// 使用者狀態管理初始設定
const session = require("express-session");
const res = require("express/lib/response");
app.use(session({
    secret: "anything",
    resave: false,
    saveUninitialized: true
}))

// 樣版引擎的初始設定
app.set("view engine", "ejs")
app.set("views", "./views");

// 處理靜態檔案
app.use(express.static("publicPath"));

// 處理 POST 傳進來的參數
app.use(express.urlencoded({extended: true}));

// 建立需要的路由
app.get("/", function(req, res) {
    res.render("index.ejs")
})

// 建立需要的路由
app.get("/member", async function(req, res) {
    // 檢查使用者是否有透過登入程序，進入會員頁
    if (!req.session.member) {
        res.redirect("/")
        return
    }

    // 從 Session 取得登入會員的名稱
    const { name } = req.session.member

    // 取得所有留言資料
    const msgCollection = db.collection("msg")
    let msgResult = await msgCollection.find({})
    let msgs = []
    await msgResult.forEach(function(msg) {
        msgs.push(msg)
    })
    msgs = msgs.reverse()

    res.render("member.ejs", { 
        name,
        msgs
     })
})

// 連線到 /error?msg=錯誤訊息
app.get("/error", function(req, res) {
    const { msg } = req.query;
    res.render("error.ejs", { msg })
})

// 註冊會員
app.post("/signup", async function(req, res){
    const { name, email, password } = req.body
    
    // 檢查資料庫中的資料
    const collection = db.collection("member")
    let result = await collection.findOne({
        email
    })

    // 如果 email 已經存在
    if (result !== null) {
        res.redirect("/error?msg=註冊失敗，信箱重複")
        return
    }

    // 將新的會員資料放到資料庫
    result = await collection.insertOne({
        name,
        email,
        password
    })

    // 新增成功，導回首頁
    res.redirect("/")
})

// 登入功能的路由
app.post("/signin", async function(req, res) {
    const { email, password } = req.body

    // 檢查資料庫中的資料
    const collection = db.collection("member")
    let result = await collection.findOne({
        $and: [
            { email },
            { password }
        ]
    });
    if (result === null) {
        res.redirect("error?msg=登入失敗，email 或 password 錯誤")
        return
    }
    // 登入成功，紀錄會員資訊在 Session 中
    req.session.member = result
    res.redirect("/member")
})

app.post("/member", async function(req, res) {
    if (!req.session.member) {
        res.redirect("/")
        return
    }
    
    const { msg } = req.body
    const { name } = req.session.member
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const date = new Date().getDate();
    const hour = new Date().getHours();
    const min = new Date().getMinutes();
    const sec = new Date().getSeconds();
    const time = `${year}/${month}/${date} ${hour}:${min}:${sec}`;
    const collection = db.collection("msg")
    if (msg !== "") {
      // 將留言資料及時間放到資料庫
      let result = await collection.insertOne({
        name,
        msg,
        time
      })
      // 新增成功，導回會員頁面
      res.redirect("/member");
    }
})

// 登出
app.get("/signout", function(req, res) {
    req.session.member = null;
    res.redirect("/")
})

// 啟動伺服器在 http://localhost:3000
app.listen(3000, function() {
    console.log("Server Started at http://localhost:3000");
})


