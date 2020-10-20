const http = require("http");
const socketio = require("socket.io");
const fs = require("fs");
const server = http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(__dirname + "/index.html", "utf-8"));
  })
  .listen(3000);

const io = socketio.listen(server);

const chat = io.of("/chat").on("connection", socket => {
  let room = "";
  let name = "";

  socket.on("client_to_server_join", data => {
    room = data.value;
    socket.join(room);
  });

  socket.on("client_to_server", data => chat.to(room).emit("server_to_client", { value: data.value }));

  socket.on("client_to_server_broadcast", data => socket.broadcast.to(room).emit("server_to_client", { value: data.value }));

  socket.on("client_to_server_personal", data => {
    const id = socket.id;
    name = data.value;
    const personalMessage = "あなたは、" + name + "さんとして入室しました。"
    chat.to(id).emit('server_to_client', { value: personalMessage })
  });

  socket.on("disconnect", () => {
    if (typeof name == "undefined") {
      console.log("未入室のまま、どこかへ去っていきました。");
    } else {
      const endMessage = name + "さんが退出しました。"
      chat.to(room).emit('server_to_client', { value: endMessage });
    }
  })
});

const fortune = io.of("/fortune").on("connection", socket => {
  const id = socket.id;
  const fortunes = ["大吉", "吉", "中吉", "小吉", "末吉", "凶", "大凶"];
  const selectedFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  const todaysFortune = "今日のあなたの運勢は..." + selectedFortune + "です。";
  fortune.to(id).emit("server_to_client", { value: todaysFortune });
})
