const mongoose=require("mongoose")

const PostSchema=new mongoose.Schema({
    name:{
        type:String  //not typeof
    },
    age:{
        type:Number
    },
    email:{
        type:String
    },
    authorId:{
        type:String
    },
    body:{
        type:String
    }
})
const Post=mongoose.model("post",PostSchema)
//always export the same name as the name of the file
module.exports =Post