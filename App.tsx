
import React, { useState } from 'react';
import { ApiConfig } from './types';
import ApiConfiguration from './components/ApiConfiguration';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);

  const handleConfigSave = (config: ApiConfig) => {
    setApiConfig(config);
  };
  
  const handleResetConfig = () => {
    setApiConfig(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 font-sans">
      {!apiConfig ? (
        <ApiConfiguration onSave={handleConfigSave} />
      ) : (
        <ChatInterface config={apiConfig} onResetConfig={handleResetConfig} />
      )}
    </div>
  );
};

export default App;
