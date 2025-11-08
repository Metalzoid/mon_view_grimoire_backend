const mongoose = require("mongoose");
const ratingSchema = require("./rating");

const bookSchema = mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: { type: [ratingSchema], required: true },
  averageRating: { type: Number, required: true },
  userId: { type: String }
});

bookSchema.pre('validate', function() {
  const average = this.ratings.length > 0
                  ? this.ratings.reduce((sum, r) => sum + r.grade, 0) / this.ratings.length
                  : 0;
  this.set({ averageRating: average })
})

module.exports = mongoose.model("Book", bookSchema);
