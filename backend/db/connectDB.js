import mongoose from 'mongoose'

const connectDB = async() => {
    try{
        await mongoose.connect(`${process.env.MONGO_URI}whatsapp`)
        console.log('Connected to MongoDB')
    } catch (err){
        console.log(`Error in connecting to MongoDB ${err.message}`)
    }
}

export default connectDB;