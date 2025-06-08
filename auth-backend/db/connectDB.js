import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}whatsapp`)
    } catch (error) {
        console.log('Error connecting to MongoDB', error.message);
    }
}

export default connectDB;