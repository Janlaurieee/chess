import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AIConfig } from '../types';
import { PERSONALITIES } from './Personalities';
import { Settings, Play, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { audioEngine } from './AudioEngine';

interface AIConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onUpdateConfig: (newConfig: AIConfig) => void;
}

export const AIConfigDialog: React.FC<AIConfigDialogProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  const [localConfig, setLocalConfig] = useState<AIConfig>({ ...config });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (key: keyof AIConfig, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTestConnection = async () => {
    audioEngine.playClick();
    setTesting(true);
    setTestResult(null);

    // Sanitize endpoint: strip trailing slashes
    let sanitizedEndpoint = localConfig.endpoint.trim();
    if (sanitizedEndpoint.endsWith('/')) {
      sanitizedEndpoint = sanitizedEndpoint.slice(0, -1);
    }

    try {
      // LM Studio usually has a GET /v1/models endpoint
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(`${sanitizedEndpoint}/models`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(id);

      if (response.ok) {
        const data = await response.json();
        const models = data?.data || [];
        const modelNames = models.map((m: any) => m.id).join(', ');
        
        setTestResult({
          success: true,
          message: modelNames 
            ? `Connected! Found models: ${modelNames}` 
            : 'Connected successfully! (No active models listed, but endpoint is active)'
        });
        
        // If there are models found, and the user hasn't typed one or it's 'gemma', we can auto-fill with the first model
        if (models.length > 0 && (!localConfig.model || localConfig.model === 'gemma')) {
          setLocalConfig(prev => ({
            ...prev,
            model: models[0].id
          }));
        }
      } else {
        setTestResult({
          success: false,
          message: `Endpoint responded with status ${response.status}. Verify CORS is enabled.`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to connect. Make sure LM Studio is running, Local Server is started, and CORS is enabled in settings.`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    audioEngine.playClick();
    onUpdateConfig(localConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] border-4 border-zinc-900 bg-zinc-50 font-mono text-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none p-6">
        <DialogHeader className="space-y-2 border-b-4 border-dashed border-zinc-900 pb-4">
          <DialogTitle className="text-xl uppercase flex items-center gap-2 text-zinc-900 font-bold font-press-start" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}>
            <Settings className="w-5 height-5 text-red-500 animate-spin-slow" />
            AI CONFIGURATION
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-600 leading-relaxed font-semibold">
            Point this retro client to your local LM Studio instance for standard 8-bit AI chess play.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Endpoint URL */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex justify-between">
              <span>LM Studio API Base URL</span>
              <span className="text-red-500">*Required</span>
            </label>
            <Input
              value={localConfig.endpoint}
              onChange={e => handleChange('endpoint', e.target.value)}
              placeholder="e.g., http://localhost:1234/v1"
              className="border-2 border-zinc-900 rounded-none bg-white font-bold h-10 px-3 outline-none focus-visible:ring-0 focus:border-red-500 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Model Identifier */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex justify-between">
              <span>Model Name in LM Studio</span>
              <span>(e.g., gemma-2-9b-it)</span>
            </label>
            <Input
              value={localConfig.model}
              onChange={e => handleChange('model', e.target.value)}
              placeholder="e.g., gemma"
              className="border-2 border-zinc-900 rounded-none bg-white font-bold h-10 px-3 outline-none focus-visible:ring-0 focus:border-red-500 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Connection Test Area */}
          <div className="p-3 border-2 border-dashed border-zinc-400 bg-zinc-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-zinc-600">Diagnostics:</span>
              <Button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="h-7 text-[10px] px-3 uppercase bg-zinc-800 hover:bg-zinc-900 text-white rounded-none font-bold border-2 border-zinc-950 flex gap-1 items-center"
              >
                {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
            
            {testResult && (
              <div className={`p-2 flex gap-2 rounded-none border text-xs items-start ${testResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="font-semibold leading-relaxed break-all">
                  {testResult.message}
                </div>
              </div>
            )}
          </div>

          {/* AI Personality Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              AI Challenger Personality
            </label>
            <Select 
              value={localConfig.personality} 
              onValueChange={val => handleChange('personality', val)}
            >
              <SelectTrigger className="border-2 border-zinc-900 rounded-none bg-white font-bold h-10 outline-none focus-visible:ring-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <SelectValue placeholder="Select personality" />
              </SelectTrigger>
              <SelectContent className="border-2 border-zinc-900 rounded-none font-mono bg-white">
                {Object.values(PERSONALITIES).map((p) => (
                  <SelectItem key={p.id} value={p.id} className="focus:bg-zinc-100">
                    <span className="mr-2 text-base">{p.avatar}</span>
                    <span className="font-black">{p.name}</span>
                    <span className="text-zinc-500 text-xs ml-1">({p.title})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-zinc-500 leading-normal italic mt-1 pl-1">
              "{PERSONALITIES[localConfig.personality]?.description}"
            </p>
          </div>

          {/* Sliders: Temperature / Delay */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Temperature ({localConfig.temperature})
              </label>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.1"
                value={localConfig.temperature}
                onChange={e => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-zinc-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Thinking Delay ({localConfig.thinkingDelay / 1000}s)
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={localConfig.thinkingDelay}
                onChange={e => handleChange('thinkingDelay', parseInt(e.target.value))}
                className="w-full accent-zinc-800"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t-4 border-dashed border-zinc-900 pt-4 gap-2 flex-row justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-none border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-900 font-bold uppercase flex-1 sm:flex-initial h-10 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-xs transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-none border-2 border-zinc-950 bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase flex-1 sm:flex-initial h-10 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-xs transition-transform active:translate-x-0.5 active:translate-y-0.5 flex gap-1 items-center justify-center"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
