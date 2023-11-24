const express = require('express')
const cors = require('cors')
const app = express()
const port=process.env.PORT||5000
const jwt = require('jsonwebtoken');

app.use(cors())
app.use(express.json())
require('dotenv').config()

//------------------------------------------------------------------//
// Payment GateWay
const stripe = require("stripe")(process.env.STRIPS_SECRET_KEY);
app.use(express.static("public"));
app.use(express.json());
// -------------------------------------------//

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.S3_BUCKET}:${process.env.SECRET_KEY}@cluster0.lh0lzsv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // console.log('connected')

    const database = client.db("PetAdoption");
    // const menuCollection = database.collection("menuCollection");
    // const reviewCollection= database.collection("reviewCollection");
    // const cartCollection= database.collection("cartCollection");
    const userCollection= database.collection("userCollection");
    const sliderCollection= database.collection("sliderCollection");
    // const paymentCollection= database.collection("paymentCollection");

    // JWT Related API
    // app.post('/jwt',async(req,res)=>{
    //   const user=req.body
    //   const token=jwt.sign(user,process.env.ACCESS_TOKEN,{ expiresIn: '1h' })
    //   res.send({token})
    // })

    // Verify token middeleware
    // const verifytoken=(req,res,next)=>{
    //   if (!req.headers.authorization) {
    //     return res.status(401).send({message:'Forbidden Access'})
    //   }
    //  const token=req.headers.authorization.split(' ')[1]
    
    // jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
    //   if (err) {
    //     return res.status(401).send({message:'Forbidden Access'})
    //   }
    //   req.decoded=decoded;
    //   next()
    // })
    // }


// Payment GateWay
  //--------------------------------------------------------------------------------------------//
  // Create a PaymentIntent with the order amount and currency
//   app.post("/create-payment-intent", async (req, res) => {
//     const { price } = req.body;
//     console.log(price,"Price in the server for payment")
//     const amount=parseInt(price*100)
//     const paymentIntent = await stripe.paymentIntents.create({
//     amount: amount,
//     currency: "usd",
//     payment_method_types: ["card"],
//     // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
//     // automatic_payment_methods: {
//     //   enabled: true,
//     // },
//   });
//   res.send({
//     clientSecret: paymentIntent.client_secret,
//   });
// });
//--------------------------------------------------------------------------------------------//




// user verify admin after verify token
    // const verifyAdmin=async(req,res,next)=>{
    //   const email=req.decoded.email;
    //   const query={email:email}
    //   const user=await userCollection.findOne(query)
    //   const isAdmin=user?.role==='admin'
    //   if (!isAdmin) {
    //     return res.status(403).send({message:'forbidden access'})
    //   }
    //   next()
    // }

    // // users Related APi
    // app.get('/users',verifytoken,verifyAdmin,async(req,res)=>{
    //   const result=await userCollection.find().toArray()
    //   res.send(result)
    // })

    // app.get('/user/admin/:email',verifytoken, async(req,res)=>{
    //   const email=req.params.email
    //   if (email!== req.decoded.email) {
    //     return res.status(403).send({message: 'Unauthorized'})
    //   }
    //   const query={email:email}
    //   const user=await userCollection.findOne(query)
    //   let isAdmin= false;
    //   if (user) {
    //     isAdmin=user?.role==='admin'
    //   }
    //   res.send({isAdmin})
    // })

    // app.delete('/users/:id',verifytoken,verifyAdmin,async(req,res)=>{
    //   const deleteId=req.params.id;
    //   const query = { _id: new ObjectId(deleteId) };
    //   const result = await userCollection.deleteOne(query);
    //   res.send(result)
    //   // console.log(result)
    // })

    // app.patch('/users/admin/:id',verifytoken,verifyAdmin,async(req,res)=>{
    //   const id=req.params.id;
    //   const filter={_id:new ObjectId(id)}
    //   const updatedDocs={
    //     $set:{
    //       role:'admin'
    //     }
    //   }
    //   const result=await userCollection.updateOne(filter,updatedDocs);
    //   res.send(result)
    // })

    app.post('/users',async(req,res)=>{
      const user=req.body;
      const query={
        email:user.email
      }
      const existingUser=await userCollection.findOne(query)
      if (existingUser) {
        return res.send({message:'user already exists',insertedId:null})
      }
      const result=await userCollection.insertOne(user)
      res.send(result)
      console.log(result)
    })

    app.put("/users", async (req, res) => {
      const data = req.body;
      const email = data.email;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          LastLogInTime: data.userLastSign,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

      // Slider Collection
      app.get('/slider',async(req,res)=>{
        const cursor = sliderCollection.find();
        const slider = await cursor.toArray();
        res.send(slider);
      })
    
    // app.get('/menu',async(req,res)=>{
    //     const cursor = menuCollection.find();
    //     const data=await cursor.toArray()
    //     res.send(data)
    // })

  //   app.get('/menu/:id',async(req,res)=>{
  //     const getID=req.params.id;
  //     const query = { _id: getID };
  //     const result = await menuCollection.findOne(query);
  //     res.send(result)
  // })

  // app.patch('/updateItems/:id', async(req,res)=>{
  //   const getID=req.params.id;
  //   const updatedData=req.body;
  //   console.log(getID)
  //   const filter = { _id: getID };
  //   const options = { upsert: true };
  //   const updateddocs={
  //     $set:{
  //       name: updatedData.name,
  //       category: updatedData.category,
  //       recipe: updatedData.recipe,
  //       image: updatedData.image,
  //       price: updatedData.price
  //     }
  //   }
  //   const result= await menuCollection.updateOne(filter, updateddocs, options)
  //   res.send(result)
  //   console.log(result)
  // })
  
    // app.delete('/menu/:id',verifytoken,verifyAdmin,async(req,res)=>{
    //   const deleteId=req.params.id;
    //   const query = { _id:deleteId};
    //   const result = await menuCollection.deleteOne(query);
    //   res.send(result)
    //   // console.log(result)
    // })

    // app.get('/reviews',async(req,res)=>{
    //     const cursor = reviewCollection.find();
    //     const data=await cursor.toArray()
    //     res.send(data)
    // })

    // app.post('/additems',verifytoken,verifyAdmin,async(req,res)=>{
    //   const data=req.body
    //   const result=await menuCollection.insertOne(data)
    //   res.send(result)
    // })
    

    // cart collection
  //  app.post('/carts',async(req,res)=>{
  //     const cartItem=req.body;
  //     const result = await cartCollection.insertOne(cartItem);
  //    res.send(result)
  //   //  console.log(result)
  //  })

  //  app.get('/carts',async(req,res)=>{
  //   const email=req.query.email;
  //   const query={email:email}
  //   const cursor = cartCollection.find(query);
  //   const data=await cursor.toArray()
  //   res.send(data) 
  //  })


  //  app.delete('/carts/:id',async(req,res)=>{
  //   const deleteID=req.params.id
  //   const query = { _id: new ObjectId(deleteID) };
  //   const result = await cartCollection.deleteOne(query);
  //   res.send(result)
  //   // console.log(result)
  //  })


  //  app.post('/payments',async(req,res)=>{
  //   const payment=req.body;
  //   console.log(payment)
  //   const paymentresult=await paymentCollection.insertOne(payment)
  //   // carefully delete each item from the cart
  //   const query={
  //     _id:{
  //       $in:payment.cartId.map(na=>new ObjectId(na))
  //     }
  //   }
  //   const deleteResult=await cartCollection.deleteMany(query)
  //   res.send({paymentresult,deleteResult})
  //   console.log(payment,deleteResult,'payment Saved')
  // })


  // app.get('/payments/:email',verifytoken,async(req,res)=>{
  //     if (req.params.email!== req.decoded.email) {
  //       return res.status(403).send({message: 'Unauthorized'})
  //     }
  //   const query={email: req.params.email}
  //   const result= await paymentCollection.find(query).toArray()
  //   res.send(result)
  // })

  // State for Analysis

  // app.get('/admin-state',verifytoken,verifyAdmin,async(req,res)=>{
  //   const users=await userCollection.estimatedDocumentCount()
  //   const menuItems=await menuCollection.estimatedDocumentCount()
  //   const orders=await paymentCollection.estimatedDocumentCount()

  //   // this is not the best way
  //   // const payments= await paymentCollection.find().toArray()
  //   // const revenue=payments.reduce((total,payment)=>total+payment.price,0)

  //   const result= await paymentCollection.aggregate([
  //     {
  //       $group:{
  //         _id:null,
  //         totalRevenue:{
  //           $sum:'$price'
  //         }
  //       }
  //     }
  //   ]).toArray()
  //   const revenue=result.length>0?result[0].totalRevenue:0;
  //   res.send({users,menuItems,orders,revenue})
  // })


    // Nameing convention
    // app.get('/users')
    // app.get('/users/:id')
    // app.post('/users')
    // app.put('/users/:id')
    // app.patch('/users/:id')
    // app.delete('/users/:id')

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// app.get('/products/:id', function (req, res, next) {
//   res.json({msg: 'This is CORS-enabled for all origins!'})
// })

app.listen(port, function () {
  console.log('CORS-enabled web server listening on port 80')
})