const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

const static_file = path.join(__dirname, "public/css");

app.set("view engine", "hbs");
app.use(express.urlencoded({ extended: true }));

//Setting MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/mydb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => console.log("Connected"))
  .catch((err) => console.log(err));

const db = mongoose.connection;

db.on("error", () => console.log("Erro in Connecting in Database"));
db.once("open", () => console.log("Connected to DataBase"));

//UserSchema
const userSchema = new mongoose.Schema({
  name: String,
  Email: String,
  Password: String,
  coin: Number,
});

const User = mongoose.model("User", userSchema);

app.use(express.static(static_file));

app.get("/", (req, res) => {
  res.render("login");
});

//Resgister the User and Stores Data in Mongo
app.post("/register", async (req, res) => {
  var full_name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;

  var user_data = new User({
    name: full_name,
    Email: email,
    Password: password,
    coin: 0.0,
  });

  console.log(user_data);

  try {
    await user_data.save();
    console.log("Record Inserted Successfully");
  } catch (err) {
    console.error("Error inserting record:", err);
  }

  return res.redirect("/");
});

app.use(express.json());

app.post("/authenticate", async (req, res) => {
  const user_email = req.body.email;
  try {
    const user = await User.findOne({ Email: user_email });
    if (user) {
      res.json({
        success: true,
        username: user.name,
        email: user.Email,
        id: user.id,
        coin: user.coin,
      });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error in authentication:", err);
    res.json({ success: false, message: "Authentication error" });
  }
});

app.get("/home", (req, res) => {
  const username = req.query.user;
  const user_email = req.query.email;
  const user_id = req.query.id;
  const coin = req.query.coin;
  const data = {
    full_name: username,
    profile_email: user_email,
    user_id: user_id,
    user_coin: coin,
  };
  res.render("home", data);
});

app.post("/home/add-coin", async (req, res) => {
  const amount = req.body.amount;
  const user_id = req.body.user_id;

  try {
    // Check if the user with the given user_id exists
    const user = await User.findOne({ _id: user_id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const totalcoin = +amount + user.coin;

    // Update the user's coin amount
    const user2 = await User.updateOne({ _id: user_id }, { $set: { coin: totalcoin } });
    if(user2){
      const user_curr_coin = user.coin;
      res.json({ success: true, tcoin: user_curr_coin });
    }
  } catch (error) {
    console.error("Error updating item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/home/add-coin" , (req,res)=>{
  res.redirect("/home")
})

app.listen(3000, () => console.log("Connected to Server"));
