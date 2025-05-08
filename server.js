require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const cookieParser = require("cookie-parser");

const userModel = require("./models/user.js");
const postModel = require("./models/post.js");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "HTML", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "HTML", "login.html"));
});

app.post("/register", (req, res) => {
  const { username, password, email, age } = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const newUser = await userModel.create({
        username,
        email,
        password: hash,
        age,
      });
      const token = jwt.sign({ email: email }, process.env.JWTSECRET);
      res.cookie("token", token);
      res.redirect("/login");
    });
  });
});

app.post("/login", async(req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({email:email });
  if (!user) {
    return res.send("invalid credentials");
  }

 
});
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
