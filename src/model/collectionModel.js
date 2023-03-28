const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

const Collection = mongoose.model("Collection", collectionSchema);

module.exports = Collection;