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
    const PetCollection = database.collection("PetCollection");
    const AdoptionCollection = database.collection("AdoptionCollection");
    const donationCollection= database.collection("donationCollection");
    // const cartCollection= database.collection("cartCollection");
    const userCollection= database.collection("userCollection");
    const categoryCollection= database.collection("categoryCollection");
    const EventsCollection= database.collection("EventsCollection");
    const sliderCollection= database.collection("sliderCollection");
    const paymentCollection= database.collection("paymentCollection");

    // JWT Related API
    app.post('/jwt',async(req,res)=>{
      const user=req.body
      const token=jwt.sign(user,process.env.ACCESS_TOKEN,{ expiresIn: '1h' })
      res.send({token})
    })

    // Verify token middeleware
    const verifytoken=(req,res,next)=>{
      if (!req.headers.authorization) {
        return res.status(401).send({message:'Forbidden Access'})
      }
     const token=req.headers.authorization.split(' ')[1]
    
    jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
      if (err) {
        return res.status(401).send({message:'Forbidden Access'})
      }
      req.decoded=decoded;
      next()
    })
    }


// Payment GateWay
  //--------------------------------------------------------------------------------------------//
  // Create a PaymentIntent with the order amount and currency
  app.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    console.log(price,"Price in the server for payment")
    const amount=parseInt(price*100)
    const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    // automatic_payment_methods: {
    //   enabled: true,
    // },
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
//--------------------------------------------------------------------------------------------//




// user verify admin after verify token
    const verifyAdmin=async(req,res,next)=>{
      const email=req.decoded.email;
      const query={email:email}
      const user=await userCollection.findOne(query)
      const isAdmin=user?.role==='admin'
      if (!isAdmin) {
        return res.status(403).send({message:'forbidden access'})
      }
      next()
    }

    // // users Related APi
    app.get('/users',verifytoken,verifyAdmin,async(req,res)=>{
      const result=await userCollection.find().toArray()
      res.send(result)
    })

    app.get('/user/admin/:email',verifytoken, async(req,res)=>{
      const email=req.params.email
      // if (email!== req.decoded.email) {
      //   return res.status(403).send({message: 'Unauthorized'})
      // }
      const query={email:email}
      const user=await userCollection.findOne(query)
      let isAdmin= false;
      if (user) {
        isAdmin=user?.role==='admin'
      }
      res.send({isAdmin})
      console.log(isAdmin)
    })

    app.delete('/users/:id',verifytoken,verifyAdmin,async(req,res)=>{
      const deleteId=req.params.id;
      const query = { _id: new ObjectId(deleteId) };
      const result = await userCollection.deleteOne(query);
      res.send(result)
      // console.log(result)
    })

    app.patch('/users/admin/:id',verifytoken,verifyAdmin,async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)}
      const updatedDocs={
        $set:{
          role:'admin'
        }
      }
      const result=await userCollection.updateOne(filter,updatedDocs);
      res.send(result)
    })

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
      // Event Collection
      app.get('/events',async(req,res)=>{
        const cursor = EventsCollection.find();
        const events = await cursor.toArray();
        res.send(events);
      })

      // Category Collection
      app.get("/Category", async (req, res) => {
        const cursor = categoryCollection.find();
        const Categories = await cursor.toArray();
        res.send(Categories);
      });
  
    
    // Pet Collection data
    app.get('/pet',async(req,res)=>{
        const cursor = PetCollection.find({ adoption_status: 'Not Adopted' }); 
        const data=await cursor.toArray()
        res.send(data)
    })

    app.get('/allpets',verifytoken,verifyAdmin,async(req,res)=>{
      const result=await PetCollection.find().toArray()
      res.send(result)
    })
    
    app.get('/alldonationcampaigns',verifytoken,verifyAdmin,async(req,res)=>{
      const result=await donationCollection.find().toArray()
      res.send(result)
    })

    app.delete('/petInformation/:id',verifytoken,verifyAdmin,async(req,res)=>{
      const deleteId=req.params.id;
      const query = { _id:new ObjectId(deleteId)};
      const result = await PetCollection.deleteOne(query);
      res.send(result)
    })

    app.delete('/donationcampaigndelete/:id',verifytoken,verifyAdmin,async(req,res)=>{
      const deleteId=req.params.id;
      const query = { _id:new ObjectId(deleteId)};
      const result = await donationCollection.deleteOne(query);
      res.send(result)
    })


    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { pet_category: id };
      const cursor = PetCollection.find(query);
      const petByCategory = await cursor.toArray();
      res.send(petByCategory);
    });

    app.get('/pet/:id',async(req,res)=>{
      const getID=req.params.id;
      const query = { _id: new ObjectId(getID) };
      const result = await PetCollection.findOne(query);
      res.send(result)
  })

  app.post("/requestforadoption/:id",verifytoken, async (req, res) => {
    const PetToId = req.params.id;
    const requestforAdoption=req.body
    const { email } = req.body;
    const filter = { _id: new ObjectId(PetToId) };
    const options = { upsert: true };

    const updateddocs={
      $set:{
        adoption_status: "Adopted",
      }
    }
    const results= await PetCollection.updateOne(filter, updateddocs, options)
    const result = await AdoptionCollection.insertOne(requestforAdoption);
    
    console.log(requestforAdoption,PetToId,email,"Book Id for the new Borrow")
    // const existing = await AdoptionCollection.findOne({ email, adoptionID: PetToId });
    // if (existing) {
    //   console.log()
    //   return res.status(400).json({ error: "Duplicate entry. Book with the same email and bookId already exists." });
    // }
    res.send({result,results});
  });

app.patch('/users/adopts/:id', async(req,res)=>{
    const getID=req.params.id;
    const filter = { _id: new ObjectId(getID) };
    const options = { upsert: true };
    const updateddocs={
      $set:{
        adoption_status: 'Adopted',
        
      }
    }
    const result= await PetCollection.updateOne(filter, updateddocs, options)
    res.send(result)
    console.log(result)
  })


  app.patch('/updatePet/:id', async(req,res)=>{
    const getID=req.params.id;
    const updatedData=req.body;
    console.log(getID,updatedData)
    const filter = { _id: new ObjectId(getID) };
    const options = { upsert: true };
    const updateddocs={
      $set:{
          image: updatedData.image,
          pet_name: updatedData.pet_name,
          pet_age: updatedData.pet_age,
          pet_category: updatedData.pet_category,
          pet_location: updatedData.pet_location,
          short_description: updatedData.short_description,
          long_description: updatedData.long_description,
          adoption_status: updatedData.adoption_status,
          max_donation_amount: updatedData.max_donation_amount,
          donated_amount: updatedData.donated_amount,
          date_added: updatedData.date_added,
          petAdderby: updatedData.petAdderby,
      }
    }
    const result= await PetCollection.updateOne(filter, updateddocs, options)
    res.send(result)
    console.log(result)
  })
  
    

    // app.get('/reviews',async(req,res)=>{
    //     const cursor = reviewCollection.find();
    //     const data=await cursor.toArray()
    //     res.send(data)
    // })

    app.post('/addpetbyuser',verifytoken,async(req,res)=>{
      const data=req.body
      const result=await PetCollection.insertOne(data)
      res.send(result)
      console.log(result)
    })
    app.post('/addDonationData',verifytoken,async(req,res)=>{
      const data=req.body
      const result=await donationCollection.insertOne(data)
      res.send(result)
      console.log(result)
    })
    
   app.get('/carts',verifytoken,async(req,res)=>{
    const email=req.query.email;
    const query={petAdderby:email}
    const cursor = PetCollection.find(query);
    const data=await cursor.toArray()
    res.send(data) 
   })

   app.get('/userAddedpet',verifytoken,async(req,res)=>{
    const email=req.query.email;
    const page=parseInt(req.query.page)||1;
    const size=parseInt(req.query.size)||10;
    const query={petAdderby:email}
    const totalItems = await PetCollection.countDocuments(query);
    const totalPages = Math.ceil(totalItems / size);
    const cursor = PetCollection.find(query).skip((page - 1)* size).limit(size);
    const data = await cursor.toArray();
    res.send({
      data,
      page,
      totalPages,
      totalItems,
  });
   })
   
   app.get('/campaigns',verifytoken,async(req,res)=>{
    const email=req.query.email;
    const query={CampaignAddedby:email}
    const cursor = donationCollection.find(query);
    const data=await cursor.toArray()
    res.send(data) 
   })

   app.get('/campaigns/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id:new ObjectId(id)}
    const cursor = await donationCollection.findOne(query);
    res.send(cursor) 
   })

   app.patch('/donationupdate/:id', async(req,res)=>{
    const getID=req.params.id;
    const updatedData=req.body;
    // console.log(getID,updatedData)
    const filter = { _id: new ObjectId(getID) };
    const options = { upsert: true };
    const updateddocs={
      $set:{
          pet_name:updatedData.pet_name, 
          image:updatedData.image, 
          donationStatus:updatedData.donationStatus, 
          UserCandonateamount:updatedData.UserCandonateamount, 
          lastdateforDonation:updatedData.lastdateforDonation, 
          CampaignAddedby:updatedData.CampaignAddedby, 
          pet_age:updatedData.pet_age, 
          pet_category:updatedData.pet_category, 
          pet_location:updatedData.pet_location, 
          short_description:updatedData.short_description, 
          long_description:updatedData.long_description, 
          adoption_status:updatedData.adoption_status, 
          max_donation_amount:updatedData.max_donation_amount, 
          donated_amount:updatedData.donated_amount, 
          date_added:updatedData.date_added
      }
    }
    const result= await donationCollection.updateOne(filter, updateddocs, options)
    res.send(result)
    console.log(result)
  })

   app.patch('/updateDonationActive/:id', verifytoken, async(req,res)=>{
    const getID=req.params.id;
    const updatedData=req.body;
    console.log(getID,updatedData)
    const filter = { _id: new ObjectId(getID) };
    const options = { upsert: true };
    const updateddocs={
      $set:{
          donationStatus: updatedData.status,
      }
    }
    const result= await donationCollection.updateOne(filter, updateddocs, options)
    res.send(result)
    console.log(result)
  })

   app.patch('/updateDonationStatus/:id',verifytoken,verifyAdmin, async(req,res)=>{
    const getID=req.params.id;
    const updatedData=req.body;
    console.log(getID,updatedData)
    const filter = { _id: new ObjectId(getID) };
    const options = { upsert: true };
    const updateddocs={
      $set:{
          donationStatus: updatedData.status,
      }
    }
    const result= await donationCollection.updateOne(filter, updateddocs, options)
    res.send(result)
    console.log(result)
  })


   app.patch('/updateInvitationRequest/:id', async(req,res)=>{
    const getID=req.params.id;
    const updatedData=req.body;
    console.log(getID,updatedData)
    const filter = { _id: new ObjectId(getID) };
    const options = { upsert: true };
    const updateddocs={
      $set:{
        adoptionRequest: updatedData.status,
      }
    }
    const result= await AdoptionCollection.updateOne(filter, updateddocs, options)
    res.send(result)
    console.log(result)
  })

   app.get('/allDonation',async(req,res)=>{
    const cursor = donationCollection.find();
    const data=await cursor.toArray()
    res.send(data) 
   })

  // cart collection
  //  app.post('/carts',async(req,res)=>{
  //     const cartItem=req.body;
  //     const result = await cartCollection.insertOne(cartItem);
  //    res.send(result)
  //   //  console.log(result)
  //  })

   app.delete('/carts/:id',async(req,res)=>{
    const deleteID=req.params.id
    const query = { _id: new ObjectId(deleteID) };
    const result = await PetCollection.deleteOne(query);
    res.send(result)
    // console.log(result)
   })


   app.get('/adoptionRequest',verifytoken,async(req,res)=>{
    const email=req.query.email;
    const query={petAdderby:email}
    const cursor = AdoptionCollection.find(query);
    const data=await cursor.toArray()
    res.send(data) 
   })

   app.post('/payments',async(req,res)=>{
    const payment=req.body;
    console.log(payment)
    const donationIdToUpdate = payment.CampaignsId;
    const donationAmountToAdd = parseFloat(payment.donated_amount);
    const paymentresult=await paymentCollection.insertOne(payment)
    const currentDonation = await donationCollection.findOne({ _id: new ObjectId(donationIdToUpdate) });
    const updatedDonatedAmount = parseFloat(currentDonation.donated_amount) + donationAmountToAdd;
    const updateDonation=await donationCollection.updateOne(
      { _id: new ObjectId(donationIdToUpdate) },
      { $set: { donated_amount: updatedDonatedAmount } }
     );
     res.send({paymentresult,updateDonation})
    console.log(payment,'payment Saved')
  })

  app.get('/dontatorsdata/:id',verifytoken,async(req,res)=>{
    const paymentId=req.params.id;
    const query={CampaignsId: paymentId}
    const result= await paymentCollection.find(query).toArray()
    res.send(result)
  })
  app.get('/alldontatorsdata',async(req,res)=>{
    const result= await paymentCollection.find().toArray()
    res.send(result)
  })

  app.patch('/updateadminAdoptionstatus/:id',verifytoken,verifyAdmin, async(req,res)=>{
    const getID=req.params.id;
    const updatedData=req.body;
    console.log(getID,updatedData)
    const filter = { _id: new ObjectId(getID) };
    const options = { upsert: true };
    const updateddocs={
      $set:{
        adoption_status: updatedData.status,
      }
    }
    const result= await PetCollection.updateOne(filter, updateddocs, options)
    res.send(result)
  })

  app.delete('/payments/:id',verifytoken,async(req,res)=>{
    const deleteID=req.params.id
    const query = { _id: new ObjectId(deleteID) };
    const result = await paymentCollection.deleteOne(query);
    res.send(result)
   })

  app.get('/payments/:email',verifytoken,async(req,res)=>{
      if (req.params.email!== req.decoded.email) {
        return res.status(403).send({message: 'Unauthorized'})
      }
    const query={paidbyuser: req.params.email}
    const result= await paymentCollection.find(query).toArray()
    res.send(result)
  })

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