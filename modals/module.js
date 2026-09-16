const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title : {

    type: String,

},
    description : String,
    image :{
        type:String,
        default : "",
        set: (v)=>
            v===""?"https://cdn.pixabay.com/photo/2018/06/08/12/58/royal-3462249_640.jpg":v,
        
    },
    
    price : Number,
    location : String,
    country :     String,
 
})



const Listing = mongoose.model("Listing",listingSchema);

module.exports = Listing;