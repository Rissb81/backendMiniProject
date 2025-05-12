
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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) return res.send("Invalid credentials");

  bcrypt.compare(password, user.password, (err, result) => {
    const token = jwt.sign({ email: email }, process.env.JWTSECRET);
    res.cookie("token", token);
    req.user = user;
    console.log(user);
    res.redirect("/profile");
  });
});

app.get("/profile", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  jwt.verify(token, process.env.JWTSECRET, async (err, decoded) => {
    if (err) return res.send("Invalid token");

    // Fetch the user and their posts
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) return res.send("User not found");

    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Profile</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #000000, #ff69b4, #1e90ff);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
          }
          .logout-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background-color: #ff69b4;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(255, 105, 180, 0.5);
            transition: all 0.3s ease;
          }
          .logout-btn:hover {
            background-color: #1e90ff;
            box-shadow: 0 6px 12px rgba(30, 144, 255, 0.5);
          }
          .form-container {
            width: 70%;
            margin-top: 20px;
            background: rgba(0, 0, 0, 0.85);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
            color: #ffffff;
          }
          h1 {
            margin-bottom: 20px;
            color: #ff69b4;
            font-size: 2rem;
            text-shadow: 0 2px 5px rgba(255, 105, 180, 0.5);
          }
          textarea {
            width: 80%;
            height: 200px;
            margin-bottom: 15px;
            padding-inline: 100px;
            border: 1px solid #1e90ff;
            border-radius: 4px;
            resize: none;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }
          textarea:focus {
            outline: none;
            border-color: #ff69b4;
            box-shadow: 0 0 10px #ff69b4;
          }
          button {
            background: linear-gradient(145deg, #1e90ff, #87cefa);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
            box-shadow: 0 5px 10px rgba(30, 144, 255, 0.5);
            transition: all 0.3s ease;
          }
          button:hover {
            background: linear-gradient(145deg, #ff69b4, #ff85c1);
            box-shadow: 0 8px 15px rgba(255, 105, 180, 0.5);
            transform: translateY(-3px);
          }
          .post {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
          }
          .post p {
            margin: 0;
            font-size: 1.2rem;
          }
          .post small {
            display: block;
            margin-top: 10px;
            color: #87cefa;
          }
        </style>
      </head>
      <body>
        <button class="logout-btn" onclick="window.location.href='/logout'">Logout</button>
        <div class="form-container">
          <h1>Welcome, ${decoded.email}</h1>
          <form action="/post" method="POST">
            <textarea name="content" placeholder="Write something..."></textarea>
            <button type="submit">Post</button>
          </form>
        </div>
        
      </body>
      </html>
    `);
  });
});

app.post("/post", async (req, res) => {
  const token = req.cookies.token; // Retrieve the token from cookies
  if (!token) return res.redirect("/login"); // Redirect if no token is found

  jwt.verify(token, process.env.JWTSECRET, async (err, decoded) => {
    if (err) return res.send("Invalid token"); // Handle invalid token

    const { content } = req.body; // Extract content from the form

    // Find the user by email to get the user's ObjectId
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) return res.status(404).send("User not found");

    // Create the post with the user's ObjectId
    const post = await postModel.create({
      userId: user._id, // Use the user's ObjectId
      postData: content, // Save the content from the form
    });

    user.posts.push(post._id); // Add the post ID to the user's posts array

    await user.save(); // Save the updated user document

    res.redirect("/profile"); // Redirect back to the profile page
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});


app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
