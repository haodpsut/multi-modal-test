
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ApiConfig, ChatMessage, MessageAuthor, ApiProvider } from '../types';
import { generateGeminiStream } from '../services/geminiService';
import { generateOpenRouterStream } from '../services/openRouterService';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { fileToBase64 } from '../utils/imageUtils';
import { Content, Part } from '@google/genai';
import { SendIcon, MicIcon, ImageIcon, UserIcon, BotIcon, SpeakerIcon, StopIcon, SettingsIcon, ArrowUpIcon } from './icons';

interface ChatInterfaceProps {
  config: ApiConfig;
  onResetConfig: () => void;
}

type ActiveTab = 'text' | 'voice' | 'image';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ config, onResetConfig }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('text');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<{ file: File; base64: string; preview: string } | null>(null);
  
  const messageListRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening } = useSpeechToText();
  const { speak } = useTextToSpeech();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (prompt: string, attachedImage?: typeof image) => {
    if (!prompt.trim() && !attachedImage || isLoading) return;


    setIsLoading(true);
    setInput('');
    if(attachedImage) setImage(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      author: MessageAuthor.USER,
      text: prompt,
      image: attachedImage ? {
          base64: attachedImage.base64,
          mimeType: attachedImage.file.type,
          preview: attachedImage.preview,
      } : undefined,
    };
    setMessages(prev => [...prev, userMessage]);

    const aiResponseId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiResponseId,
      author: MessageAuthor.AI,
      text: '',
      isStreaming: true,
    };
    setMessages(prev => [...prev, aiMessage]);
    
    try {
      let stream;
      if (config.provider === ApiProvider.GEMINI) {
        const history: Content[] = messages.map(msg => {
            const parts: Part[] = [];
            // Gemini API expects image parts to come before text parts
            if (msg.author === MessageAuthor.USER && msg.image) {
              parts.push({
                inlineData: {
                  data: msg.image.base64,
                  mimeType: msg.image.mimeType,
                }
              });
            }
            if (msg.text) {
               parts.push({ text: msg.text });
            }
            return {
              role: msg.author === MessageAuthor.USER ? 'user' : 'model',
              parts: parts,
            };
          }).filter(c => c.parts.length > 0);

        stream = generateGeminiStream(config.geminiApiKey, prompt, history, attachedImage?.base64, attachedImage?.file.type);
      } else {
        const history = messages
          .filter(m => !m.image) // OpenRouter models don't support image history
          .map(m => ({
            role: m.author,
            content: m.text
          }));
        stream = generateOpenRouterStream(config.openRouterApiKey, config.openRouterModel, prompt, history);
      }

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: fullText } : m));
      }

      setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, isStreaming: false } : m));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: `Error: ${errorMessage}`, isStreaming: false } : m));
    } finally {
      setIsLoading(false);
      stopListening();
    }
  }, [isLoading, config, messages, stopListening]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      setImage({ file, base64, preview });
      setActiveTab('image');
    }
  };

  const renderInputArea = () => {
    const commonInput = (placeholder: string) => (
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input, activeTab === 'image' ? image : undefined);
          }
        }}
        placeholder={placeholder}
        className="w-full p-3 pr-12 bg-gray-700/60 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200"
        disabled={isLoading}
      />
    );

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    switch (activeTab) {
      case 'voice':
        return (
          <div className="flex items-center gap-2">
            {commonInput(isListening ? 'Listening...' : 'Press the mic and start speaking...')}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-full transition-all duration-200 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-600 hover:bg-purple-500'}`}
              disabled={isLoading}
            >
              <MicIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        );
      case 'image':
        return (
          <div>
            {image ? (
              <div className="relative group mb-2 w-fit">
                <img src={image.preview} alt="Upload preview" className="max-h-40 rounded-lg" />
                <button onClick={() => setImage(null)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <StopIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-2 text-gray-400"/>
                        <p className="text-sm text-gray-400">Click to upload an image</p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" />
                </label>
            )}
            <div className="relative">
              {commonInput('Ask a question about the image...')}
              <button
                onClick={() => handleSendMessage(input, image)}
                disabled={(!input.trim() && !image) || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-purple-600 rounded-full text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors"
              >
                <ArrowUpIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 'text':
      default:
        return (
          <div className="relative">
            {commonInput('Type your message...')}
            <button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-purple-600 rounded-full text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors"
            >
              <ArrowUpIcon className="w-5 h-5" />
            </button>
          </div>
        );
    }
  };

  const TabButton = ({ tab, icon, label }: { tab: ActiveTab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => {
        if (config.provider === ApiProvider.OPENROUTER && tab === 'image') return;
        setActiveTab(tab);
      }}
      disabled={config.provider === ApiProvider.OPENROUTER && tab === 'image'}
      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors duration-200 text-sm font-medium
        ${activeTab === tab ? 'bg-gray-800/70 text-purple-400' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}
        ${config.provider === ApiProvider.OPENROUTER && tab === 'image' ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
        <header className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                {config.provider} Chat
            </h1>
            <button onClick={onResetConfig} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
                <SettingsIcon className="w-4 h-4"/>
                Change Settings
            </button>
        </header>

      <div ref={messageListRef} className="flex-grow overflow-y-auto pr-2 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
            {msg.author === MessageAuthor.AI && (
              <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <BotIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`max-w-xl p-4 rounded-2xl ${msg.author === MessageAuthor.USER ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
              {msg.image?.preview && <img src={msg.image.preview} alt="User upload" className="max-h-48 rounded-lg mb-2" />}
              <p className="whitespace-pre-wrap">{msg.text}{msg.isStreaming && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1" />}</p>
              {msg.author === MessageAuthor.AI && !msg.isStreaming && msg.text && (
                <button onClick={() => speak(msg.text)} className="mt-2 text-gray-400 hover:text-white transition-colors">
                    <SpeakerIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            {msg.author === MessageAuthor.USER && (
              <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-500/20">
        <div className="flex border-b border-purple-500/20 mb-2">
            <TabButton tab="text" icon={<SendIcon className="w-4 h-4"/>} label="Text" />
            <TabButton tab="voice" icon={<MicIcon className="w-4 h-4"/>} label="Voice" />
            <TabButton tab="image" icon={<ImageIcon className="w-4 h-4"/>} label="Image" />
            {config.provider === ApiProvider.OPENROUTER && activeTab === 'image' && 
              <span className="text-xs text-yellow-400 self-center ml-4">Image input is only available with Gemini.</span>
            }
        </div>
        <div className="bg-gray-800/70 p-2 rounded-b-lg">
          {renderInputArea()}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;