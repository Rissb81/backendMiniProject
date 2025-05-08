const mongoose = require("mongoose");
const { type } = require("os");

mongoose
  .connect(process.env.DBURL)
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((err) => {
    console.log(err);
  });

const userSchema = new mongoose.Schema({
  userName: String,
  email: String,
  password: String,
  age: Number,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});



module.exports = mongoose.model("user",userSchema)