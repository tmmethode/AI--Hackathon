import mongoose, { Schema, Document } from 'mongoose';

export interface IHelloWorld extends Document {
  message: string;
  timestamp: Date;
  createdBy?: string;
}

const HelloWorldSchema: Schema = new Schema({
  message: {
    type: String,
    required: true,
    default: 'Hello World'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: false
  }
});

export default mongoose.model<IHelloWorld>('HelloWorld', HelloWorldSchema);
