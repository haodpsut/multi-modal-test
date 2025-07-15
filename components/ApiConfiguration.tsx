
import React, { useState } from 'react';
import { ApiProvider, ApiConfig } from '../types';
import { OPEN_ROUTER_FREE_MODELS } from '../constants';
import { GeminiIcon, OpenRouterIcon, KeyIcon, ModelIcon, ArrowRightIcon } from './icons';

interface ApiConfigurationProps {
  onSave: (config: ApiConfig) => void;
}

const ApiConfiguration: React.FC<ApiConfigurationProps> = ({ onSave }) => {
  const [provider, setProvider] = useState<ApiProvider>(ApiProvider.GEMINI);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState(OPEN_ROUTER_FREE_MODELS[0].id);

  const isSaveDisabled = 
    (provider === ApiProvider.GEMINI && !geminiApiKey) ||
    (provider === ApiProvider.OPENROUTER && !openRouterApiKey);

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave({
        provider,
        geminiApiKey,
        openRouterApiKey,
        openRouterModel,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-lg p-8 space-y-8 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Multi-Modal AI Chat</h1>
          <p className="mt-2 text-gray-400">Configure your AI provider to begin.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setProvider(ApiProvider.GEMINI)}
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-200 ${provider === ApiProvider.GEMINI ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 hover:border-purple-400'}`}
          >
            <GeminiIcon className="w-8 h-8 mb-2" />
            <span className="font-semibold">Gemini</span>
          </button>
          <button
            onClick={() => setProvider(ApiProvider.OPENROUTER)}
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-200 ${provider === ApiProvider.OPENROUTER ? 'border-pink-500 bg-pink-500/20' : 'border-gray-600 hover:border-pink-400'}`}
          >
            <OpenRouterIcon className="w-8 h-8 mb-2" />
            <span className="font-semibold">OpenRouter</span>
          </button>
        </div>

        <div className="space-y-4">
          {provider === ApiProvider.GEMINI && (
            <div className="relative">
              <KeyIcon className="absolute w-5 h-5 text-gray-400 top-3.5 left-3"/>
              <input
                type="password"
                placeholder="Enter your Gemini API Key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              />
            </div>
          )}

          {provider === ApiProvider.OPENROUTER && (
            <>
              <div className="relative">
                <KeyIcon className="absolute w-5 h-5 text-gray-400 top-3.5 left-3"/>
                <input
                  type="password"
                  placeholder="Enter your OpenRouter API Key"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                />
              </div>
              <div className="relative">
                <ModelIcon className="absolute w-5 h-5 text-gray-400 top-3.5 left-3"/>
                <select
                  value={openRouterModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                >
                  <option value="" disabled>Select a free model</option>
                  {OPEN_ROUTER_FREE_MODELS.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-white rounded-lg transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50"
        >
          Start Chatting
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ApiConfiguration;
