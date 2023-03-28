const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  link: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection" 
  }
}, {
  timestamps: true
});

const Link = mongoose.model("Link", linkSchema);

module.exports = Link;