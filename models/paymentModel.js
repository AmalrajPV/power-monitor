var mongoose =  require("mongoose");

const paymentSchema = new mongoose.Schema({
    username: {
        type: String,
        required:true,
        ref: "user",
    },
    mobile: {
        type: String,
        required:true,
        ref: "user",
    },
    cid: {
        type: String,
        required:true,
        ref: "user",
    },
    key: {
        type: String,
        required:true,
        ref: "user",
    },
    amount:{
        type: Number,
        required:true,
    },
    paid:{
        type: Boolean,
        required: true,
        default: false,
    },
    consumption: {
        type: Number,
        required:true,
    }
},
{timestamps: true}
);

const payment = mongoose.model("payment", paymentSchema);
module.exports = payment;
