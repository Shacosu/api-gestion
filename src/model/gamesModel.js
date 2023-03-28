const mongoose = require("mongoose");

const gamesModel = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  sku: {
    type:String,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
  },
  image: {
    type: String,
  },
  discount: {
    type: String,
  },
  url: {
    type: String,
  },
  provider: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection" 
  }
}, {
  timestamps: true
});

const Games = mongoose.model("Game", gamesModel);

module.exports = Games;