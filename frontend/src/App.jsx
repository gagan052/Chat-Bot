import { useState, useRef, useEffect } from 'react'
import './App.css'
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('conversations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved conversations", e);
        return [];
      }
    }
    return [];
  });

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatContainerRef = useRef(null);
  
  // Load active conversation from localStorage
  useEffect(() => {
    const activeId = localStorage.getItem('activeConversationId');
    if (activeId && conversations.some(conv => conv.id === activeId)) {
      setActiveConversationId(activeId);
      setChatHistory(conversations.find(conv => conv.id === activeId).messages || []);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);
  
  // Save active conversation ID to localStorage
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('activeConversationId', activeConversationId);
    }
  }, [activeConversationId]);
  
  // Update the active conversation with current chat history
  useEffect(() => {
    if (activeConversationId && chatHistory.length > 0) {
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === activeConversationId 
            ? { ...conv, messages: chatHistory, lastUpdated: new Date().toISOString() }
            : conv
        )
      );
    }
  }, [chatHistory, activeConversationId]);
  
  // Scroll to bottom of chat container when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Create a new conversation
  const createNewChat = () => {
    const newId = uuidv4();
    const newConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
    setChatHistory([]);
    setAnswer("");
  };
  
  // Switch to a different conversation
  const switchConversation = (id) => {
    setActiveConversationId(id);
    const conversation = conversations.find(conv => conv.id === id);
    setChatHistory(conversation.messages || []);
  };
  
  // Delete a conversation
  const deleteConversation = (id, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    if (activeConversationId === id) {
      const remaining = conversations.filter(conv => conv.id !== id);
      if (remaining.length > 0) {
        switchConversation(remaining[0].id);
      } else {
        createNewChat();
      }
    }
  };
  
  // Format the AI response with proper markdown and code blocks
  const formatAIResponse = (text) => {
    // Replace code blocks with properly formatted ones
    let formattedText = text;
    
    // Format code blocks with ```language
    formattedText = formattedText.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
      return `<div class="code-block">
        <div class="code-header">
          <span class="code-language">${language || 'code'}</span>
        </div>
        <pre><code class="${language || ''}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>`;
    });
    
    // Format inline code with `code`
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Format bold text with **text**
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Format italic text with *text*
    formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Format lists
    formattedText = formattedText.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Format numbered lists
    formattedText = formattedText.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/(<li>.+<\/li>\n?)+/g, '<ol>$&</ol>');
    
    // Format paragraphs
    formattedText = formattedText.replace(/(?:\r\n|\r|\n){2,}/g, '</p><p>');
    formattedText = `<p>${formattedText}</p>`;
    
    // Clean up any double paragraph tags
    formattedText = formattedText.replace(/<\/p><p><\/p><p>/g, '</p><p>');
    
    // Sanitize the HTML to prevent XSS attacks
    return DOMPurify.sanitize(formattedText);
  };
  
  // Generate answer from API
  async function generateAnswer() {
    if (!question.trim()) return;
    
    // Create a new conversation if none is active
    if (!activeConversationId) {
      createNewChat();
    }
    
    setIsLoading(true);
    // Add user question to chat history
    const userMessage = { type: 'user', content: question, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMessage]);
    
    try {
      const response = await axios({
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDWmkU6ltiPl-1AwdCFVwLzTMdrqfnCbAk",
        method: "post",
        data: {"contents":[{"parts":[{"text": question }]}]}
      });
      
      const aiResponse = response['data']['candidates'][0]['content']['parts'][0]['text'];
      const formattedResponse = formatAIResponse(aiResponse);
      setAnswer(aiResponse);
      
      // Add AI response to chat history
      const aiMessage = { 
        type: 'ai', 
        content: aiResponse, 
        formattedContent: formattedResponse,
        timestamp: new Date().toISOString() 
      };
      setChatHistory(prev => [...prev, aiMessage]);
      
      // Update conversation title if it's the first message
      if (conversations.find(conv => conv.id === activeConversationId)?.messages.length === 0) {
        const title = question.length > 30 ? question.substring(0, 30) + '...' : question;
        setConversations(prev => 
          prev.map(conv => 
            conv.id === activeConversationId 
              ? { ...conv, title }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Error generating answer:", error);
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        content: "Sorry, I couldn't generate a response. Please try again.",
        formattedContent: "<p>Sorry, I couldn't generate a response. Please try again.</p>",
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
      setQuestion(""); // Clear input after sending
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateAnswer();
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`bg-gray-800 text-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0'}`}>
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Conversations</h2>
          <button 
            onClick={createNewChat}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map(conv => (
                <div 
                  key={conv.id} 
                  onClick={() => switchConversation(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${activeConversationId === conv.id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                >
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{conv.title}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {new Date(conv.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-600"
                    title="Delete conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-4 shadow-md flex items-center">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 p-1 rounded hover:bg-blue-700 transition-colors"
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-2xl font-bold">AI Chat Assistant</h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={createNewChat}
                className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Chat
              </button>
              <div className="text-sm bg-blue-700 px-3 py-1 rounded-full shadow-sm">Powered by Gemini</div>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full bg-gray-800"
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-xl font-medium">Start a conversation</p>
            <p className="text-sm mt-2">Ask anything you'd like to know</p>
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-4 shadow ${message.type === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}
              >
                {message.type === 'user' ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <div 
                    className="ai-response" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.formattedContent || message.content) }}
                  />
                )}
                <div className="text-xs opacity-70 mt-2 text-right">
                  {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg rounded-bl-none p-4 shadow max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <textarea
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 p-3 rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              rows="2"
              disabled={isLoading}
            ></textarea>
            <button
              onClick={generateAnswer}
              disabled={isLoading || !question.trim()}
              className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${isLoading || !question.trim() 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
     </div>
    </div>
  )
}

export default App
