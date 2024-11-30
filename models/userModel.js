const mongoose=require('mongoose')

const userschema=mongoose.Schema({
    name: String,
    email:String,
    password:String,
    contact:Number,
    AmountOwed:{
        type:Map,
        of:Number,
        default:{},
    },
    Topay:{
        type:Number,
        default:0
    },
    createdAt: {
        type: Date,
        default: Date.now
      },


    
}
)
module.exports=mongoose.model('User',userschema)