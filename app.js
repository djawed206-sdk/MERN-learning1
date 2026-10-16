//create the server
const express=require("express")
const app=express()
app.use(express.json())  //to send json 

const cors=require("cors") //Without CORS configuration, the browser blocks the frontend from reading the backend’s responses. 
app.use(cors())

//use bcrypt for password
const bcrypt=require("bcrypt")

//use JWT
const JWT=require("jsonwebtoken")

require('dotenv').config(); // must run before you read process.env
const PORT = process.env.PORT || 3000; // fallback if PORT is missing


//fixing the probleme of the dns in my computer that affects the server connection with the database , but on production i should not use this fix bcs i will be using the dns of another computer ruuning on the internet that has a good dns 
//so basically on production Render, Railway, Heroku, Vercel, Fly.io: they set NODE_ENV=production automatically for Node apps
if (process.env.NODE_ENV !== 'production') {
  const dns = require('node:dns');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

//connect to database mongoDB
const mongoose=require("mongoose")
 async function connectToMongoDB() {
  try {
    await mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.njato6l.mongodb.net/?appName=Cluster0`);
    console.log("You successfully connected to MongoDB!");
    return mongoose;
  } catch (err) {
    console.dir(err);
  }
}
// Call this only when your application terminates
 async function disconnectFromMongoDB() {
  await mongoose.connection.close();
}

connectToMongoDB()

//importing models
let PostModel=require("./models/Post")
let AdminModel=require("./models/Admin")

//getPosts
app.get("/posts",async(req,res)=>{
  try{
 let posts=await PostModel.find() 
   
    res.status(200).json(posts)
  }
  catch(error){
    res.status(500).json({error:error})
  } 
})

//get one post by id
app.get("/posts/:idSelected",auth,async(req,res)=>{
try{
    let id=req.params.idSelected
    
    let post=await PostModel.findById(id)
    let userId=req.user.authorId
    if(userId!=post.authorId){
     return  res.status(403).json({message:"not allowed"})
    }

   if(!post){
    res.status(404).json({error:"post not found"})
  } 
  res.status(200).json(post)
}
catch(error){
    res.status(400).json({error:error.message})
}
})

//create post
app.post("/posts",auth,async(req,res)=>{
  try{
     let newPost= new PostModel(req.body)
    let userId=req.user.authorId
    newPost.authorId=userId
    console.log("main",newPost)
    let post=await newPost.save()
    res.status(200).json(post)
  }
   catch(error){
    res.status(400).json({error:error.message})
   }
})

//update post
app.put("/posts/:idUpdated",auth,async(req,res)=>{
  try{
 let id=req.params.idUpdated
 let findPost=await PostModel.findById(id)

 let userId=req.user.authorId
 console.log("hdi t3 middleware",userId)
 console.log("hdi t3 post",findPost.authorId)

 if(userId!=findPost.authorId){
  return res.status(403).json({message:"not allowed"})
 }
  
  let user=await PostModel.findByIdAndUpdate(id,req.body)
  res.status(200).json(req.body)
  }
catch(error){
    res.status(400).json({error:error.message})
   }
})


//delete user
app.delete("/posts/:idDeleted",auth,async(req,res)=>{
  try{
 let id=req.params.idDeleted

 let findPost=await PostModel.findById(id)
 let userId=req.user.authorId
 console.log("t3 userId:",userId)
 console.log("t3 findPost:",findPost.authorId)

 if(userId!=findPost.authorId){
  return res.status(403).json({message:"not allowed"})
 }


  let postDeleted=await PostModel.findByIdAndDelete(id)
  res.json(postDeleted)
  }
  catch(error){
    res.status(400).json({error:error.message})
   }
 
})


//register
app.post("/register",async(req,res)=>{
  try{
  let admin=await AdminModel.findOne({username:req.body.username})
  if(admin){
   return res.json({error:"username already exist"})
  }
  let newAdmin=new AdminModel({
    username:req.body.username,
    password:await bcrypt.hash(req.body.password,10)
  })
  let save=await newAdmin.save()
  res.json(save)
}
catch(error){
  res.json({error:error.message})
}

})


//login
app.post("/login",async(req,res)=>{
  let {username,password}=req.body
  
  let user=await AdminModel.findOne({username})
  if(!user){
   return res.json({error:"username doesn't exist"}) 
  }
  let isPasswordValid=await bcrypt.compare(password,user.password)
  if(!isPasswordValid){
   return res.json({error:"wrong username or password"}) //dont tell which one to make the hacker confused and try more
  }
const token=JWT.sign({authorId:user._id},process.env.SECRET)

res.json({
  user:user,
  token:token
})
  
})



//The auth middleware (the “security guard”)
function auth(req,res,next){
const header=req.headers.authorization

if(!header){
  return res.status(401).json({message:"no token"})
}

try{
  const token=header.split(' ')[1]
  req.user=JWT.verify(token,process.env.SECRET)
  
next()
}
catch(err){
res.status(400).json({message:err ?.message})
}
}

//listening to the server
app.listen(PORT,()=>{
    console.log(`server running succusfully on port ${PORT}`)
})
