const mongoose = require("mongoose");

const ratingSchema = mongoose.Schema({
  userId: { type: String, required: true },
  grade: { type: Number, required: true },
});

module.exports = mongoose.model("Rating", ratingSchema);
