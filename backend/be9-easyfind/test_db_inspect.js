const mongoose = require("mongoose");
const LostItem = require("./models/LostItem");
const Item = require("./models/FoundItem");
const User = require("./models/User");

async function inspect() {
  await mongoose.connect("mongodb://127.0.0.1:27017/easyfind");
  
  console.log("--- Lost Items in DB ---");
  const lostItems = await LostItem.find({});
  console.log(JSON.stringify(lostItems, null, 2));

  console.log("\n--- Found Items in DB ---");
  const foundItems = await Item.find({});
  console.log(JSON.stringify(foundItems, null, 2));

  console.log("\n--- Users in DB ---");
  const users = await User.find({});
  console.log(JSON.stringify(users, null, 2));

  await mongoose.disconnect();
}

inspect();
