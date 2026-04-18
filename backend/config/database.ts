import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hackathon';
    
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB successfully');
    return { success: true };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return { success: false, error };
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};
