const mongoose = require("mongoose");
var { ObjectId } = mongoose.Schema;
var Schema = mongoose.Schema;

const TaskSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Task',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    userId: {
      type: Number,
      maxlength: 32,
      trim: true,
      require :true
    },
    groupId: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      require : true
    },
    
    estTime: {
      type: Number,
      required : true
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    comepleted : {
      type : Boolean,
      default : false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
