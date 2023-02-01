var bcrypt = require("bcryptjs");
const payment = require("../models/paymentModel");
const sensor = require("../models/sensorModel");
const user = require("../models/userModel");
const moment = require("moment");

function calculateBill(units) {
  let bill = 0
  if (units <= 100) {
    bill =  units * 10;
  } else if (units <= 200) {
    bill = 100 * 10 + (units - 100) * 15;
  } else if (units <= 300) {
    bill = 100 * 10 + 100 * 15 + (units - 200) * 20;
  } else if (units > 300) {
    bill = 100 * 10 + 100 * 15 + 100 * 20 + (units - 300) * 25;
  }
  parseFloat(parseFloat(bill).toFixed(2))
  return bill;
}

function reconnectUser(cid){
  return new Promise((resolve, reject)=>{
  user.findOneAndUpdate({
    cid: cid
  },
  {
  $set: {
    active: true,
    power_status: true,
  }
},
{
  new: true
}).then(()=>{return resolve();}).catch((er)=>reject(er));
});
}

module.exports = {
  signin: function (data) {
    return new Promise(async (resolve, reject) => {
      let _user = await user.findOne({ email: data.email });
      if (!_user) return reject("Invalid Credentials");
      const err = await bcrypt.compare(data.password, _user.password);
      if (!err) return reject("Invalid Credentials");
      return resolve({ _user });
    });
  },

  register: function (data) {
    return new Promise(async (resolve, reject) => {
      if (data.password !== data.confirm) return reject("confirm password");
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(data.password, salt);
      const newuser = new user({
        username: data.username,
        email: data.email,
        mobile: data.mobile,
        cid: data.cid,
        key: data.key,
        password: hash,
      });
      newuser.save((err, res) => {
        if (err) return reject(err._message ? err._message : "Error details");
        return resolve(res);
      });
    });
  },
  homeData: function (data) {
    return new Promise(async (resolve, reject) => {
      let r = await user
        .findOne({ _id: data }, { password: 0, payments: 0 })
        .lean();
      resolve(r);
    });
  },
  saveSensor: function (data) {
    return new Promise(async (resolve, reject) => {
      let r = await user.findOne({ key: data.key });
      if (r) {
        data.cid = r.cid;
        const newval = new sensor(data);
        await newval.save((err, res) => {
          if (err) return;
          return resolve("updated");
        });
      }
    });
  },
  getSensorLatest: function (k) {
    return new Promise(async (resolve, reject) => {
      let r = await sensor.find({ key: k });
      if (r) {
        return resolve(r[r.length - 1]);
      }
      reject("not found");
    });
  },
  editProfile: function (data, id) {
    return new Promise(async (resolve, reject) => {
      await user
        .findOneAndUpdate({ _id: id }, data, { new: true })
        .then((r) => resolve(r))
        .catch((err) => reject(err));
    });
  },
  getBills: function (key) {
    return new Promise(async (resolve, reject) => {
      
      const notpaid = await payment.aggregate([
        {
            $match:{
                paid: false, 
                key: key
            }
        },
        {
            $project:{
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y",
                        date: "$createdAt"
                    }
                },
                cid: 1,
                consumption: 1,
                key: 1,
                username: 1,
                mobile: 1,
                amount: 1,
                paid: 1
            }
        }
    ]).sort({createdAt: -1});
    
      return resolve({ notpaid });
    });
  },
  getPaidBills: function(key, limit, offset) {
    return new Promise(async(resolve, reject)=>{

      const paid = await payment.aggregate([
        {
          $match:{
            paid: true, 
              key: key
          }
        },
        {
          $project:{
              createdAt: {
                  $dateToString: {
                      format: "%d-%m-%Y",
                      date: "$createdAt"
                    }
                  },
                  updatedAt: {
                  $dateToString: {
                      format: "%d-%m-%Y",
                      date: "$createdAt"
                    }
                  },
              cid: 1,
              consumption: 1,
              key: 1,
              username: 1,
              mobile: 1,
              amount: 1,
              paid: 1
            }
          }
        ]).sort({updatedAt: -1}).skip(offset).limit(limit);
        count = await payment.countDocuments({paid: true,
          key: key})
        return resolve({paid, count});
      })
  },
  isUserActive: function(id) {
    return new Promise((resolve, reject)=>{
      user.findOne(
        {_id: id}).then((res)=>{
          return resolve(res?.active)
        }).catch((err)=>{return reject(err)});
    })
    
  },
  addBill: function () {
    return new Promise(async (resolve, reject) => {
      (await user.find({active:true})).forEach(async (e) => {
        const currentDate = new Date();
        const prevMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          currentDate.getDate()
        );

        sensor
          .find({ cid: e.cid, createdAt: { $gte: prevMonth } })
          .sort({ energy: -1 })
          .limit(1)
          .then((highest) => {
            sensor
              .find({ cid: e.cid, createdAt: { $gte: prevMonth } })
              .sort({ energy: 1 })
              .limit(1)
              .then((lowest) => {
                const diff = parseFloat(parseFloat((highest[0]?.energy || 0) - (lowest[0]?.energy || 0)));
                let amount = calculateBill(diff);
                const newPay = new payment({
                  username: e.username,
                  mobile: e.mobile,
                  cid: e.cid,
                  key: e.key,
                  amount: amount,
                  consumption: diff,
                });
                newPay.save((res, err) => {
                  console.log("here");
                });
              })
              .catch((err) => console.log(err));
          })
          .catch((err) => console.log(err));
      });
      return resolve("success");
    });
  },
  disconnectUser: async()=>{
    return new Promise(async (resolve, reject)=>{
      (await payment.find({paid:false})).forEach(async (e) => {
      user.findOneAndUpdate({
        cid: e.cid
      },
      {
      $set: {
        active: false,
        power_status: false,
      }
    },
    {
      new: true
    }).catch((er)=>reject(er));
    });
    return resolve(true);
  })
  },
  payBill: (cid, id)=>{
    return new Promise((resolve, reject)=>{
      payment.findOneAndUpdate({
        cid: cid,
        _id: id
      },
      {
        $set: {
          paid: true,
        },
      },
      {
        new: true,
      }).then(async (res)=>{
        let payments = await payment.find({
          cid: cid,
          paid: false
        })
        if (payments.length == 0) {
          reconnectUser(cid);
        }
        return resolve(res)
      }).catch((err)=>reject(err));
    })
  },
  weeklySensor: (cid) => {
    return new Promise(async (resolve, reject) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000);

      sensor
        .aggregate([
          {
            $match: { cid: cid, createdAt: { $gte: startDate, $lt: endDate } },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              highest: { $max: "$energy" },
              lowest: { $min: "$energy" },
            },
          },
          {
            $project: {
              _id: 1,
              highest: 1,
              lowest: 1,
              difference: { $subtract: ["$highest", "$lowest"] },
            },
          },
        ])
        .then((result) => {
          let pastSevenDays = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(
              startDate.getTime() + i * 24 * 60 * 60 * 1000
            );
            const startOfDay = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            )
              .toISOString()
              .substring(0, 10);
            pastSevenDays.push({
              id: startOfDay,
              highest: 0,
              lowest: 0,
              difference: 0,
            });
          }
          result.forEach((day) => {
            pastSevenDays.forEach((pastDay) => {
              if (pastDay.id === day._id) {
                pastDay.highest = day.highest;
                pastDay.lowest = day.lowest;
                pastDay.difference = day.difference;
              }
            });
          });
          let id = pastSevenDays.map(({ id }) => id);
          let difference = pastSevenDays.map(({ difference }) =>
            parseFloat(parseFloat(difference).toFixed(3))
          );
          pastSevenDays = Object.assign(
            {},
            { id: id },
            { difference: difference }
          );
          return resolve(pastSevenDays);
        })
        .catch((error) => reject(error));
    });
  },

  monthlyEnergy: (cid) => {
    return new Promise(async (resolve, reject) => {
      try {
        let currentMonthStart = moment().startOf("month");
        let currentMonthEnd = moment().endOf("month");
        let latestEnergyCurrentMonth = await sensor
          .findOne({
            cid: cid,
            createdAt: {
              $gte: currentMonthStart.toDate(),
              $lt: currentMonthEnd.toDate(),
            },
          })
          .sort({ energy: -1 })
          .select("energy");

        // Find the latest energy for the previous month
        let previousMonthStart = moment()
          .subtract(1, "months")
          .startOf("month");
        let previousMonthEnd = moment().subtract(1, "months").endOf("month");
        let latestEnergyPreviousMonth = await sensor
          .findOne({
            createdAt: {
              $gte: previousMonthStart.toDate(),
              $lt: previousMonthEnd.toDate(),
            },
          })
          .sort({ energy: -1 })
          .select("energy");

        // Calculate overall energy for the current month
        latestEnergyCurrentMonth = latestEnergyCurrentMonth?.energy;
        latestEnergyPreviousMonth = latestEnergyPreviousMonth?.energy;
        let overallEnergy =
          (latestEnergyCurrentMonth || 0) - (latestEnergyPreviousMonth || 0);
        return resolve(overallEnergy);
      } catch (error) {
        return reject(error);
      }
    });
  },

  showPowerStatus: (key) => {
    return new Promise((resolve, reject) => {
      user
        .findOne({ key: key })
        .then((res) => {
          return resolve(res.power_status);
        })
        .catch((e) => {
          return reject(e);
        });
    });
  },
  togglePower: (key) => {
    return new Promise((resolve, reject) => {
      user
        .findOneAndUpdate(
          { key: key },
          [{ $set: { power_status: { $eq: [false, "$power_status"] } } }],
          { new: true }
        )
        .then((r) => {
          return resolve(r);
        })
        .catch((e) => {
          return reject(e);
        });
    });
  },
};
