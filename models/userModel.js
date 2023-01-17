var mongoose =  require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required:true,
    },
    email: {
        type: String,
        required:true,
        unique: true,
    },
    mobile: {
        type: String,
        required:true,
    },
    cid: {
        type: String,
        required:true,
        unique: true,
    },
    key: {
        type: String,
        required:true,
        unique: true,
    }, 
    password:{
        type: String,
        required:true,
    },
    power_status:{
        type:Boolean,
        required: true,
        default: false
    }
},
{timestamps: true}
);

const user = mongoose.model("user", userSchema);
module.exports = user;
