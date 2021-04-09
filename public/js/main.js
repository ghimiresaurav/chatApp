const socket = io();
const container = document.getElementById("container");
const userIcon = document.querySelector(".fa-user-circle");
const messageWrapper = document.getElementById("message-wrapper");
sessionStorage.clear();

const createRoom = () => {
  removeButtons();
  document.getElementById("create-room-form").style.display = "inherit";
};

const joinRoom = () => {
  removeButtons();
  document.getElementById("join-room-form").style.display = "inherit";
};

const removeButtons = () => {
  container.style.height = `250px`;
  const buttons = document.getElementsByClassName("room");
  if (buttons) {
    buttons[1].remove();
    buttons[0].remove();
  }
};

const loadChatPage = () => {
  const chatPage = document.getElementById("chat-field-body");
  chatPage.style.display = "block";
  const indexPage = document.getElementById("index-body");
  indexPage.remove();
};

const joinChatRoom = (e) => {
  e.preventDefault();
  const name = document.getElementById("user-name").value;
  const title = document.getElementById("user-room").value;
  const password = document.getElementById("room-password").value;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, title, password }),
  };
  fetch("/join-room", options);

  setTimeout(async () => {
    const userDetails = await fetch("/user-details");
    const user = await userDetails.json();
    loadChatPage();
    let { name, room } = user;

    document.getElementById(
      "current-user-card"
    ).innerHTML = `<i class="fas fa-user-circle"></i><h2 id="current-user">${name}</h2>`;
    document.getElementById("room-name").innerText = room;
    sessionStorage.setItem("username", name);
    socket.emit("joinRoom", { username: name, room });
  }, 100);
};

const wrapMessage = (message) => {
  const { uname, time, text } = message;
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  let userType = "user";
  if (uname == "Bot") {
    //message is from bot
    userType = "bot";
    const splittedText = text.split("has");
    if (splittedText.length > 1) {
      //bot notifies a user joining or leaving the room
      messageDiv.innerHTML = `<span class="${userType}-name">${uname} <i class="fas fa-robot"></i></span>
                          <span class="time">${time}</span>
                          <p class="text">
                            <span class="user-name">${splittedText[0]}</span>has${splittedText[1]}
                          </p>`;
    } else {
      //greeting message from bot
      messageDiv.innerHTML = `<span class="${userType}-name">${uname} <i class="fas fa-robot"></i></span>
                          <span class="time">${time}</span>
                          <p class="text">${text}</p>`;
    }
  } else {
    // message is from a user
    messageDiv.innerHTML = `<span class="${userType}-name">${uname}</span>
                          <span class="time">${time}</span>
                          <p class="text">${text}</p>`;
  }

  messageWrapper.appendChild(messageDiv);
};

socket.on("message", (message) => {
  wrapMessage(message);
  messageWrapper.scrollTop = messageWrapper.scrollHeight;
});

socket.on("currentUsers", (users) => {
  if (users[0].room) {
    const currentUsers = document.getElementsByClassName("current-users");
    if (currentUsers.length) {
      const length = currentUsers.length;
      for (let i = 0; i < length; i++) {
        currentUsers[0].remove();
      }
    }

    const leftPane = document.getElementById("left-pane");
    users.forEach((user) => {
      let card = document.createElement("div");
      card.classList.add("current-users");
      card.classList.add("cards");
      card.innerText = user.username;
      leftPane.appendChild(card);
    });
  }
});

document.querySelector("#message-input").addEventListener("submit", (event) => {
  event.preventDefault();
  const msg = document.getElementById("msg").value.trim();
  const username = sessionStorage.getItem("username");
  if (msg) socket.emit("text", { user: username, msg });
  document.getElementById("msg").value = "";
});
