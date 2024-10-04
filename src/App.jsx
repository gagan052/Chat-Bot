import { useState } from 'react'
import './App.css'
import axios from 'axios';

function App() {
  const [question, setQuestion] = useState("");
  const [ answer , setAnswer] = useState("");

 async function generateAnswer(){

  setAnswer("loading..");

  const response = await axios({
    url:"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDWmkU6ltiPl-1AwdCFVwLzTMdrqfnCbAk",
    method:"post",
    data:{"contents":[{"parts":[{"text": question }]}]}
  });

    setAnswer(response['data']['candidates'][0]['content']['parts'][0]['text'])

    


 }

  return (
    <>
      <h1 className="bg-blue-300">chat ai</h1>

      <textarea 
      className="border rounded w-full"
      value={ question } onChange={(e)=> setQuestion(e.target.value)} cols="30" rows="10"
      placeholder="ask anything"
      ></textarea>
      
      <button onClick={generateAnswer}>Generate Answer</button>
      <pre>{answer}</pre>
    </>
  )
}

export default App
