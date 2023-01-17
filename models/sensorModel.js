var mongoose =  require("mongoose");

const sensorSchema = new mongoose.Schema({
    voltage: {
        type: Number,
        required:true,
    },
    current: {
        type: Number,
        required:true,
    },
    power: {
        type: Number,
        required:true,
    },
    frequency: {
        type: Number,
        required:true,
    },
    energy: {
        type: Number,
        required:true,
    },
    pf: {
        type: String,
        required:true,
    },
    key: {
        type: String,
        required:true,
    },
    cid:{
        type: String,
        required:true,
    }
},
{timestamps: true}
);

const sensor = mongoose.model("sensor", sensorSchema);
module.exports = sensor;
