const mongoose = require('mongoose')


const postSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    postData:String,
    date:{
        type:Date,
        default:Date.now    
    }
})


module.exports = mongoose.model('post',postSchema)