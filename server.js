const express = require("express");
const path = require("path");
const chalk = require("chalk");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const http = require("http");
const socketio = require("socket.io");
const mysqldump = require("mysqldump");

const {
  newUser,
  getCurrentUser,
  getRoomUsers,
  removeUser,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "1mb" }));

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = newUser(socket.id, username, room);
    socket.join(user.room);

    //welcoming new user
    socket.emit("message", formatMessage("Bot", "Welcome to Viper"));

    //notify other users in the room about a new user joining that room
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage("Bot", `${user.username} has joined the room.`)
      );

    io.to(user.room).emit("currentUsers", getRoomUsers(user.room));
  });

  //listen for a textmessage
  socket.on("text", (text) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(text.user, text.msg));
  });

  //notify other users in the room about a new user leaving that room
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage("Bot", `${user.username} has left the room.`)
      );
      io.to(user.room).emit("currentUsers", getRoomUsers(user.room));
    }
  });
});

const db = mysql.createConnection({
  host: "localhost",
  user: "gill",
  password: "123456",
  database: "chatrooms",
  insecureAuth: true,
});

app.post("/create-room", async (req, res) => {
  const room = req.body;
  const hashedPassword = await bcrypt.hash(room.password, 10);
  db.connect((err) => {
    if (err) throw err;
    const sql = `INSERT INTO rooms(title, password) VALUES('${room.title}', '${hashedPassword}')`;
    db.query(sql);
    mysqldump({
      connection: {
        host: "localhost",
        user: "gill",
        password: "123456",
        database: "chatrooms",
      },
      dumpToFile: "database_dump.txt",
    });
  });
  return res.redirect("/");
});

app.post("/join-room", async (req, res) => {
  const room = req.body;
  const sql = `SELECT * FROM rooms WHERE title='${room.title}'`;

  db.query(sql, async (err, result) => {
    if (err) throw err;
    let roomPassword = 0;
    if (result[0]) roomPassword = result[0].password;

    !roomPassword
      ? res.redirect("/") //the room doesn't exist
      : (await bcrypt.compare(room.password, roomPassword))
      ? toChatField(room) //room exists and the password entered is correct
      : res.redirect("/"); //room exists but the password entered is incorrect
  });

  const toChatField = (room) => {
    user = {
      name: room.name,
      room: room.title,
    };

    app.get("/user-details", (req, res) => {
      res.json(user);
    });
  };
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(chalk.magenta(`SERVER STARTED ON PORT ${PORT}`))
);

const formatMessage = (uname, text) => {
  let hours = new Date().getHours();
  let minutes = new Date().getMinutes();
  let dayTime = "AM";

  if (hours > 12) {
    dayTime = "PM";
    hours -= 12;
  }

  if (minutes < 10) minutes = `0${minutes}`;

  return {
    uname,
    time: `${hours}:${minutes} ${dayTime}`,
    text,
  };
};
