const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  }
});

const commentModel = mongoose.model('Comment', commentSchema);

module.exports = {
  commentSchema,
  commentModel
  // method: function()
};
