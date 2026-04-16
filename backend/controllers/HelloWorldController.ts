import { Route, Get, Tags } from 'tsoa';
import HelloWorld, { IHelloWorld } from '../models/HelloWorld';

@Tags('Hello World')
@Route('hello')
export class HelloWorldController {
  
  @Get('/')
  public async getHelloWorld(): Promise<{ message: string; timestamp: string }> {
    try {
      const helloWorldDoc: IHelloWorld | null = await HelloWorld.findOne().sort({ timestamp: -1 });
      
      if (helloWorldDoc) {
        return {
          message: helloWorldDoc.message,
          timestamp: helloWorldDoc.timestamp.toISOString()
        };
      }
      
      return {
        message: 'Hello World!',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching hello world:', error);
      return {
        message: 'Hello World!',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('/create')
  public async createHelloWorld(): Promise<{ message: string; timestamp: string }> {
    try {
      const newHelloWorld: IHelloWorld = new HelloWorld({
        message: 'Hello World from MongoDB!',
        createdBy: 'system'
      });
      
      await newHelloWorld.save();
      
      return {
        message: newHelloWorld.message,
        timestamp: newHelloWorld.timestamp.toISOString()
      };
    } catch (error) {
      console.error('Error creating hello world:', error);
      return {
        message: 'Hello World!',
        timestamp: new Date().toISOString()
      };
    }
  }
}
