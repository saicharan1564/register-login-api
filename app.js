const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");

const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//1.REGISTER NEW USER

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  let checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user(username,name,password,gender,location)
    VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length >= 5) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//2.LOGIN USER

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const findUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(findUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (comparePassword === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

//3.UPDATE PASSWORD

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserPassword = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(checkUserPassword);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (comparePassword === true) {
      if (newPassword.length > 4) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user 
        SET password = '${hashedNewPassword}' WHERE username = '${username}';`;
        const updatePassword = await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
