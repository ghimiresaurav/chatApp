const users = [];

const newUser = (id, username, room) => {
  const user = {
    id,
    username,
    room,
  };

  users.push(user);
  return user;
};

const getCurrentUser = (id) => users.find((user) => user.id == id);

const getRoomUsers = (room) => users.filter((user) => user.room == room);

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id == id);
  if (index != -1) return users.splice(index, 1)[0];
};

module.exports = {
  newUser,
  getCurrentUser,
  getRoomUsers,
  removeUser,
};
