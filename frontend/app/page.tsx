import Link from "next/link";
import { Button } from '@/components/ui/button';
import { CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 ">
        <div className="text-center space-y-6 max-w-3xl">
          <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 leading-tight">
            Transform Your Youtube
            <br/> Content Strategy
          </h1>
          <p className="text-2xl text-gray-600 max-w-2xl mx-auto bg-clip-text">
            Generate Fresh, Engaging ideas for your Youtube Channel in seconds.
            Never Run out of Content again! 
          </p>
          <div className="flex flex-row items-center justify-center gap-4 pt-4">
            <Link href="/videos">
              <Button className='font-semibold text-lg px-8 py-6 bg-gradient-to-r from-red-600 to-red-400 leading-tight hover:opacity-90 rounded-xl hover:scale-105 transition-all' size='lg'>
                👉Get Started for Free 
              </Button>
            </Link>
            <p className="text-sm text-gray-500">No credit card required</p>
          </div>
          <div className="pt-8 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle className='text-red-500 h-5 w-5' />
              <span className="text-gray-600">AI Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className='text-red-500 h-5 w-5' />
              <span className="text-gray-600">Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className='text-red-500 h-5 w-5' />
              <span className="text-gray-600">Free to Try</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
