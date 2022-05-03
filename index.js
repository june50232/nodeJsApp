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
app.get("/", async function(req, res) {
    // 取得所有留言資料
    const msgCollection = db.collection("msg")
    let msgResult = await msgCollection.find({})
    let msgs = []
    await msgResult.forEach(function(msg) {
        msgs.push(msg)
    })
    msgs = msgs.reverse()

    res.render("index.ejs", { 
        msgs
     })
})

app.post("/message", async function(req, res) {
    const { name, msg } = req.body
    console.log('test----', name, msg)
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const date = new Date().getDate();
    const hour = new Date().getHours();
    const min = new Date().getMinutes();
    const sec = new Date().getSeconds();
    const time = `${year}/${month}/${date} ${hour}:${min}:${sec}`;
    const collection = db.collection("msg")
    
    if (name!== "" && msg !== "") {
      // 將留言資料及時間放到資料庫
      let result = await collection.insertOne({
        name,
        msg,
        time
      })
      // 新增成功，導回會員頁面
      res.redirect("/");
    }
})

// 啟動伺服器在 http://localhost:3000
app.listen(3000, function() {
    console.log("Server Started at http://localhost:3000");
})


