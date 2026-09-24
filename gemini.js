/**
 * CleanExcel - Universal AI Engine & Multi-Provider Integration Service
 * Supported Providers: Google Gemini, OpenAI, Anthropic Claude, Groq, DeepSeek, OpenRouter, Mistral
 * Automatically detects key formats and routes requests accordingly.
 */

const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    badge: 'Google',
    defaultModel: 'gemini-3.6-flash',
    keyPrefixes: ['AIza', 'AQ.'],
    keyPlaceholder: 'Paste Google Gemini API key (AIzaSy... or AQ....)',
    models: [
      { id: 'gemini-3.6-flash',               label: 'Gemini 3.6 Flash',            badge: '🚀 Latest',   desc: 'Latest & fastest Gemini model' },
      { id: 'gemini-2.5-pro',                 label: 'Gemini 2.5 Pro',              badge: '🧠 Pro',      desc: 'Most capable reasoning & coding' },
      { id: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash Preview',    badge: '🔥 Preview',  desc: 'Preview build of 2.5 Flash' },
      { id: 'gemini-1.5-flash',               label: 'Gemini 1.5 Flash',            badge: '📦 Stable',   desc: 'Reliable workhorse model' },
      { id: 'gemini-1.5-pro',                 label: 'Gemini 1.5 Pro',              badge: '🏆 Pro',      desc: 'Large context window' },
      { id: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash',            badge: '⚡ Legacy',   desc: 'Second generation Gemini' },
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    icon: '⚡',
    badge: 'OpenAI',
    defaultModel: 'gpt-4o',
    keyPrefixes: ['sk-proj-', 'sk-'],
    keyPlaceholder: 'Paste OpenAI API key (sk-proj-... or sk-...)',
    models: [
      { id: 'gpt-4o',                         label: 'GPT-4o (Omni)',               badge: '🚀 Flagship', desc: 'Fast, highly intelligent flagship' },
      { id: 'gpt-4o-mini',                    label: 'GPT-4o Mini',                 badge: '⚡ Speedy',   desc: 'Ultra-fast, cost-effective workhorse' },
      { id: 'o3-mini',                        label: 'o3-mini Reasoning',           badge: '🧠 Reasoning', desc: 'Deep mathematical & structured logic' },
      { id: 'gpt-4-turbo',                    label: 'GPT-4 Turbo',                 badge: '🏆 Turbo',    desc: 'High-capability GPT-4 engine' },
      { id: 'gpt-3.5-turbo',                  label: 'GPT-3.5 Turbo',               badge: '📦 Classic',  desc: 'Legacy speed model' },
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    icon: '🎭',
    badge: 'Anthropic',
    defaultModel: 'claude-3-7-sonnet-20250219',
    keyPrefixes: ['sk-ant-'],
    keyPlaceholder: 'Paste Anthropic Claude API key (sk-ant-...)',
    models: [
      { id: 'claude-3-7-sonnet-20250219',     label: 'Claude 3.7 Sonnet',           badge: '🚀 Latest',   desc: 'State-of-the-art hybrid reasoning & speed' },
      { id: 'claude-3-5-sonnet-20241022',     label: 'Claude 3.5 Sonnet',           badge: '🧠 Smart',    desc: 'Top-tier code and data structuring' },
      { id: 'claude-3-5-haiku-20241022',      label: 'Claude 3.5 Haiku',            badge: '⚡ Fast',     desc: 'Near-instant lightweight model' },
      { id: 'claude-3-haiku-20240307',       label: 'Claude 3 Haiku',              badge: '📦 Classic',  desc: 'Reliable fast classic' },
    ]
  },
  groq: {
    id: 'groq',
    name: 'Groq (Ultra-Fast LPU)',
    icon: '⚡',
    badge: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPrefixes: ['gsk_'],
    keyPlaceholder: 'Paste Groq API key (gsk_...)',
    models: [
      { id: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B Versatile',     badge: '🚀 Blazing',  desc: 'Near-instant LPU inference speed' },
      { id: 'llama-3.1-8b-instant',           label: 'Llama 3.1 8B Instant',        badge: '⚡ Sub-100ms', desc: 'Ultra-fast lightweight model' },
      { id: 'mixtral-8x7b-32768',             label: 'Mixtral 8x7B',                badge: '🏆 MoE',      desc: 'High-speed Mixture of Experts' },
    ]
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🐋',
    badge: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    keyPrefixes: ['sk-'],
    keyPlaceholder: 'Paste DeepSeek API key (sk-...)',
    models: [
      { id: 'deepseek-chat',                  label: 'DeepSeek V3 Chat',            badge: '🚀 High IQ',  desc: 'State-of-the-art open weights model' },
      { id: 'deepseek-reasoner',              label: 'DeepSeek R1 Reasoner',        badge: '🧠 Reasoner', desc: 'Deep chain-of-thought reasoning' },
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Universal)',
    icon: '🌐',
    badge: 'OpenRouter',
    defaultModel: 'openai/gpt-4o-mini',
    keyPrefixes: ['sk-or-'],
    keyPlaceholder: 'Paste OpenRouter API key (sk-or-...)',
    models: [
      { id: 'openai/gpt-4o-mini',             label: 'GPT-4o Mini (via OpenRouter)', badge: '⚡ Fast',    desc: 'Universal routing to GPT-4o-mini' },
      { id: 'google/gemini-2.5-flash',        label: 'Gemini 2.5 Flash (via OR)',   badge: '✨ Gemini',   desc: 'Google Gemini via OpenRouter' },
      { id: 'anthropic/claude-3.5-sonnet',    label: 'Claude 3.5 Sonnet (via OR)',  badge: '🎭 Claude',   desc: 'Anthropic Claude via OpenRouter' },
      { id: 'deepseek/deepseek-chat',         label: 'DeepSeek V3 (via OR)',        badge: '🐋 DeepSeek', desc: 'DeepSeek Chat via OpenRouter' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (via OR)',   badge: '🦙 Llama',    desc: 'Meta Llama 3.3 via OpenRouter' },
    ]
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🌪️',
    badge: 'Mistral',
    defaultModel: 'mistral-large-latest',
    keyPrefixes: [],
    keyPlaceholder: 'Paste Mistral API key',
    models: [
      { id: 'mistral-large-latest',           label: 'Mistral Large Latest',        badge: '🚀 Large',    desc: 'Flagship multilingual reasoning' },
      { id: 'mistral-small-latest',           label: 'Mistral Small Latest',        badge: '⚡ Small',    desc: 'Fast and lightweight' },
      { id: 'codestral-latest',               label: 'Codestral Latest',            badge: '💻 Code',     desc: 'Specialized code and parsing' },
    ]
  }
};

const GeminiService = {
  DEFAULT_API_KEY: '',
  MODEL_NAME: 'gemini-3.6-flash',
  API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
  PROVIDERS: PROVIDERS,

  /**
   * Automatically detect provider from an API key string
   */
  detectProvider(key) {
    const k = (key || this.getApiKey() || '').trim();
    if (!k) return 'gemini';
    if (k.startsWith('sk-ant-')) return 'anthropic';
    if (k.startsWith('gsk_')) return 'groq';
    if (k.startsWith('sk-or-')) return 'openrouter';
    if (k.startsWith('AIza') || k.startsWith('AQ.')) return 'gemini';
    if (k.startsWith('sk-proj-')) return 'openai';
    if (k.startsWith('sk-')) {
      const savedProvider = this.getProvider();
      if (savedProvider === 'deepseek' || savedProvider === 'openrouter' || savedProvider === 'mistral') {
        return savedProvider;
      }
      return 'openai';
    }
    return this.getProvider() || 'gemini';
  },

  /** Cookie persistence helpers (backup against browser close / session clear) */
  _getCookie(name) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  },
  _setCookie(name, value, days = 3650) {
    if (typeof document === 'undefined') return;
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Strict`;
  },
  _deleteCookie(name) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
  },

  /** Get active provider ID */
  getProvider() {
    let saved = '';
    if (typeof localStorage !== 'undefined') {
      try {
        saved = localStorage.getItem('cleanexcel_ai_provider') || '';
      } catch (e) {}
    }
    if (!saved) {
      saved = this._getCookie('cleanexcel_ai_provider') || '';
      if (saved && typeof localStorage !== 'undefined') {
        try { localStorage.setItem('cleanexcel_ai_provider', saved); } catch (e) {}
      }
    }
    if (saved && PROVIDERS[saved]) return saved;

    const key = this.getApiKey();
    if (key) {
      if (key.startsWith('sk-ant-')) return 'anthropic';
      if (key.startsWith('gsk_')) return 'groq';
      if (key.startsWith('sk-or-')) return 'openrouter';
      if (key.startsWith('AIza') || key.startsWith('AQ.')) return 'gemini';
    }
    return 'gemini';
  },

  /** Set active provider ID */
  setProvider(providerId) {
    if (PROVIDERS[providerId]) {
      if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('cleanexcel_ai_provider', providerId); } catch (e) {}
      }
      this._setCookie('cleanexcel_ai_provider', providerId, 3650);
      const defaultMod = PROVIDERS[providerId].defaultModel;
      this.setModel(defaultMod);
      this.AVAILABLE_MODELS = PROVIDERS[providerId].models;
    }
  },

  /** Get all supported providers */
  getAllProviders() {
    return Object.values(PROVIDERS);
  },

  /** Get provider details */
  getProviderInfo(providerId) {
    const id = providerId || this.getProvider();
    return PROVIDERS[id] || PROVIDERS.gemini;
  },

  /** Dynamic AVAILABLE_MODELS getter based on active provider */
  get AVAILABLE_MODELS() {
    const provider = this.getProvider();
    if (this._customModels && this._customModels[provider]) {
      return this._customModels[provider];
    }
    return (PROVIDERS[provider] && PROVIDERS[provider].models) || PROVIDERS.gemini.models;
  },
  set AVAILABLE_MODELS(models) {
    if (!this._customModels) this._customModels = {};
    this._customModels[this.getProvider()] = models;
  },

  /** Badge & description hints for known model families */
  _modelMeta(id) {
    const d = id.toLowerCase();
    if (d.includes('3.7') || d.includes('3.6')) return { badge: '🚀 Latest', desc: 'Latest generation — fastest & most capable' };
    if (d.includes('4o-mini') || d.includes('haiku') || d.includes('8b') || d.includes('small')) return { badge: '⚡ Speedy', desc: 'Ultra-fast, low latency' };
    if (d.includes('4o') || d.includes('2.5-pro') || d.includes('sonnet') || d.includes('70b') || d.includes('large') || d.includes('chat')) return { badge: '🧠 Smart', desc: 'High capability reasoning' };
    if (d.includes('reasoner') || d.includes('o3') || d.includes('o1')) return { badge: '🔬 Deep Think', desc: 'Advanced reasoning' };
    if (d.includes('preview')) return { badge: '🔥 Preview', desc: 'Preview build — cutting-edge features' };
    if (d.includes('flash')) return { badge: '⚡ Flash', desc: 'Fast & efficient' };
    if (d.includes('pro')) return { badge: '🧠 Pro', desc: 'High-capability model' };
    return { badge: '🤖 AI', desc: 'AI Model' };
  },

  /**
   * Fetch all models available for the current API key from Google's API.
   * Caches result per key in memory.
   */
  _modelCache: {},
  async fetchModelsFromAPI(key) {
    const testKey = (key || this.getApiKey() || '').trim();
    if (!testKey) return null;

    const provider = this.detectProvider(testKey);
    if (provider !== 'gemini') {
      return (PROVIDERS[provider] && PROVIDERS[provider].models) || null;
    }

    if (this._modelCache[testKey]) return this._modelCache[testKey];

    try {
      const res = await fetch(`${this.API_BASE}?key=${encodeURIComponent(testKey)}&pageSize=100`);
      if (!res.ok) return null;
      const data = await res.json();
      const rawModels = data.models || [];

      const filtered = rawModels
        .filter(m => {
          const methods = m.supportedGenerationMethods || [];
          return methods.includes('generateContent');
        })
        .map(m => {
          const id = m.name.replace('models/', '');
          const displayName = m.displayName || id;
          const label = displayName
            .replace(/^gemini\s*/i, 'Gemini ')
            .replace(/\b(\d+\.\d+)\b/g, '$1');
          const meta = this._modelMeta(id);
          return {
            id,
            label: label.length > 2 ? label : `Gemini ${id.replace('gemini-', '')}`,
            badge: meta.badge,
            desc: m.description ? m.description.split('.')[0] : meta.desc,
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit,
          };
        })
        .sort((a, b) => {
          const ver = id => {
            const m = id.match(/(\d+)\.?(\d*)/);
            return m ? parseFloat(`${m[1]}.${m[2] || '0'}`) : 0;
          };
          return ver(b.id) - ver(a.id);
        });

      if (filtered.length > 0) {
        this._modelCache[testKey] = filtered;
        this.AVAILABLE_MODELS = filtered;
        return filtered;
      }
    } catch (e) {}
    return null;
  },

  /** Get currently selected model */
  getModel() {
    let saved = '';
    if (typeof localStorage !== 'undefined') {
      try { saved = localStorage.getItem('cleanexcel_gemini_model') || ''; } catch (e) {}
    }
    if (!saved) {
      saved = this._getCookie('cleanexcel_gemini_model') || '';
      if (saved && typeof localStorage !== 'undefined') {
        try { localStorage.setItem('cleanexcel_gemini_model', saved); } catch (e) {}
      }
    }
    if (saved) return saved;
    const provider = this.getProvider();
    return (PROVIDERS[provider] && PROVIDERS[provider].defaultModel) || this.MODEL_NAME;
  },

  /** Persist selected model to localStorage & cookie */
  setModel(modelId) {
    if (modelId) {
      if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('cleanexcel_gemini_model', modelId); } catch (e) {}
      }
      this._setCookie('cleanexcel_gemini_model', modelId, 3650);
    }
  },

  /** Get metadata for the currently active model */
  getModelInfo() {
    const current = this.getModel();
    const provider = this.getProvider();
    const list = this.AVAILABLE_MODELS;
    const match = list.find(m => m.id === current);
    if (match) return match;
    const pInfo = this.getProviderInfo(provider);
    return { id: current, label: current, badge: pInfo.icon || '🤖', desc: `${pInfo.name} model` };
  },

  getApiKey() {
    let key = '';
    if (typeof localStorage !== 'undefined') {
      try {
        key = localStorage.getItem('cleanexcel_gemini_api_key') || '';
      } catch (e) {}
    }
    // Fallback / sync from persistent cookie if localStorage was cleared on browser close
    if (!key) {
      const cookieKey = this._getCookie('cleanexcel_gemini_api_key');
      if (cookieKey) {
        key = cookieKey;
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('cleanexcel_gemini_api_key', key);
          } catch (e) {}
        }
      }
    }
    return key || this.DEFAULT_API_KEY;
  },

  setApiKey(key) {
    if (key && key.trim()) {
      const trimmed = key.trim();
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('cleanexcel_gemini_api_key', trimmed);
        } catch (e) {}
      }
      this._setCookie('cleanexcel_gemini_api_key', trimmed, 3650);
      const detected = this.detectProvider(trimmed);
      this.setProvider(detected);
    } else {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem('cleanexcel_gemini_api_key');
        } catch (e) {}
      }
      this._deleteCookie('cleanexcel_gemini_api_key');
    }
  },

  isConfigured() {
    const key = this.getApiKey();
    return !!(key && key.trim().length > 5);
  },

  hasCustomKey() {
    const key = this.getApiKey();
    return !!(key && key.trim().length > 5);
  },

  getMaskedKeyDisplay() {
    const key = this.getApiKey();
    if (!key || key.trim().length === 0) return 'Not Configured';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '••••••••••••••••••••••••••••••••••••';
    return `${trimmed.slice(0, 4)}••••••••••••••••••••••••••••${trimmed.slice(-4)}`;
  },

  /**
   * Robust JSON extractor: safely handles markdown code fences (```json ... ```)
   */
  _extractJSON(text) {
    if (!text || typeof text !== 'string') return null;
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    try {
      return JSON.parse(clean);
    } catch (e) {
      const arrayMatch = clean.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]);
        } catch (e2) {}
      }
      const objMatch = clean.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch (e3) {}
      }
      throw new Error(`Failed to parse AI response as JSON. Response preview: ${text.slice(0, 120)}...`);
    }
  },

  /**
   * Robust JSON array extractor: always guarantees an array return
   * Safely unwraps nested object properties like { results: [...] }, { data: [...] }, { items: [...] },
   * or numbered keys { "0": {...}, "1": {...} } commonly returned by OpenRouter, OpenAI, and Claude.
   */
  _extractJSONArray(text) {
    if (!text || typeof text !== 'string') return [];
    let raw;
    try {
      raw = this._extractJSON(text);
    } catch (e) {
      console.warn('JSON extraction failed, attempting regex array fallback:', e);
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          raw = JSON.parse(match[0]);
        } catch (e2) {}
      }
    }

    if (!raw) return [];
    if (Array.isArray(raw)) return raw;

    if (typeof raw === 'object') {
      const candidateKeys = ['results', 'data', 'rows', 'items', 'list', 'output', 'classifications', 'records', 'addresses', 'values', 'stories', 'years', 'occupancies', 'constructions', 'walls', 'roofs', 'payload'];
      for (const key of candidateKeys) {
        if (Array.isArray(raw[key])) {
          return raw[key];
        }
      }
      for (const key of Object.keys(raw)) {
        if (Array.isArray(raw[key])) {
          return raw[key];
        }
      }
      const values = Object.values(raw);
      if (values.length > 0 && typeof values[0] === 'object' && values[0] !== null) {
        return values;
      }
      return [raw];
    }

    return [];
  },

  /**
   * Universal HTTP request dispatcher supporting all providers
   */
  async _makeUniversalRequest(systemPrompt, userText, customKey, modelOverride, providerOverride) {
    const key = (customKey || this.getApiKey() || '').trim();
    if (!key) {
      throw new Error('No API Key provided. Please enter your AI API key in Settings.');
    }

    const providerId = providerOverride || this.detectProvider(key);
    const currentModel = modelOverride || (providerOverride ? PROVIDERS[providerId]?.defaultModel : this.getModel());

    // 1. Google Gemini Provider
    if (providerId === 'gemini') {
      const baseUrl = `${this.API_BASE}/${currentModel}:generateContent`;
      const url = `${baseUrl}?key=${encodeURIComponent(key)}`;
      const payload = {
        generationConfig: {
          responseMimeType: 'application/json',
          response_mime_type: 'application/json'
        },
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userText }] }]
      };

      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        try {
          res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify(payload)
          });
        } catch (fallbackErr) {
          throw new Error(`Network connection to Google Gemini failed: ${netErr.message || fallbackErr.message}`);
        }
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error ? errJson.error.message : `HTTP ${res.status}`;
        throw new Error(`Google Gemini Error: ${errMsg}`);
      }

      const data = await res.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) throw new Error('Gemini returned an empty response.');
      return textOutput;
    }

    // 2. Anthropic Claude Provider
    if (providerId === 'anthropic') {
      const url = 'https://api.anthropic.com/v1/messages';
      const payload = {
        model: currentModel,
        system: systemPrompt + '\nOutput strictly valid JSON. Do not wrap in explanations.',
        messages: [{ role: 'user', content: userText }],
        max_tokens: 4096,
        temperature: 0.1
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error ? errJson.error.message : `HTTP ${res.status}`;
        throw new Error(`Anthropic Claude Error: ${errMsg}`);
      }

      const data = await res.json();
      const textOutput = data.content?.[0]?.text;
      if (!textOutput) throw new Error('Claude returned an empty response.');
      return textOutput;
    }

    // 3. OpenAI-Compatible Providers (OpenAI, Groq, DeepSeek, OpenRouter, Mistral)
    const endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      mistral: 'https://api.mistral.ai/v1/chat/completions'
    };

    const url = endpoints[providerId] || endpoints.openai;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    };
    if (providerId === 'openrouter') {
      headers['HTTP-Referer'] = window.location?.origin || 'http://localhost:5500';
      headers['X-Title'] = 'Neural Underwriting';
    }

    const payload = {
      model: currentModel,
      messages: [
        { role: 'system', content: systemPrompt + '\nOutput strictly valid JSON only.' },
        { role: 'user', content: userText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    };

    let res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    // Retry without response_format if provider rejects json_object mode
    if (!res.ok && res.status === 400) {
      delete payload.response_format;
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson.error ? (errJson.error.message || JSON.stringify(errJson.error)) : `HTTP ${res.status}`;
      throw new Error(`${PROVIDERS[providerId]?.name || 'AI'} Error: ${errMsg}`);
    }

    const data = await res.json();
    const textOutput = data.choices?.[0]?.message?.content;
    if (!textOutput) throw new Error('AI Provider returned an empty response.');
    return textOutput;
  },

  /** Backward-compatible makeRequest */
  async _makeRequest(payload, customKey, modelOverride) {
    const systemPrompt = payload?.system_instruction?.parts?.[0]?.text || 'You are an AI assistant. Return valid JSON.';
    const userText = payload?.contents?.[0]?.parts?.[0]?.text || '';
    return this._makeUniversalRequest(systemPrompt, userText, customKey, modelOverride);
  },

  /**
   * Test API key connectivity
   */
  async testConnection(customKey) {
    const key = (customKey || this.getApiKey() || '').trim();
    if (!key) throw new Error('No API Key provided. Please paste your API key above.');

    const providerId = this.detectProvider(key);
    const pInfo = this.getProviderInfo(providerId);
    const model = this.getModel();

    const text = await this._makeUniversalRequest(
      'Respond with a JSON object: {"status": "connected", "message": "Model is connected successfully."}',
      `Ping connection test for ${model}`,
      key,
      model,
      providerId
    );

    return {
      success: true,
      provider: pInfo.name,
      model: model,
      message: `${pInfo.name} (${model}) is connected.`
    };
  },

  /**
   * Auto-detect all models compatible with the given API key across providers.
   * Probes models in parallel with individual 8s timeouts.
   */
  async autoDetectModels(key, onProgress) {
    const testKey = (key || this.getApiKey() || '').trim();
    if (!testKey) throw new Error('No API key provided.');

    let providerId = this.detectProvider(testKey);
    let candidateModels = (PROVIDERS[providerId] && PROVIDERS[providerId].models) || PROVIDERS.gemini.models;

    // For Google Gemini, try live fetch first
    if (providerId === 'gemini') {
      try {
        const liveModels = await this.fetchModelsFromAPI(testKey);
        if (liveModels && liveModels.length > 0) candidateModels = liveModels;
      } catch (e) {}
    }

    const probeOne = (model, prov) => new Promise(resolve => {
      const start = Date.now();
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000));

      Promise.race([
        this._makeUniversalRequest(
          '{"ping":"pong"}',
          'Hi',
          testKey,
          model.id,
          prov
        ),
        timeout
      ])
        .then(() => {
          const latency = Date.now() - start;
          if (onProgress) onProgress(model.id, 'ok', latency);
          resolve({ ...model, provider: prov, ok: true, latency });
        })
        .catch(() => {
          if (onProgress) onProgress(model.id, 'fail');
          resolve({ ...model, provider: prov, ok: false, latency: null });
        });
    });

    const probes = candidateModels.map(m => probeOne(m, providerId));
    let results = await Promise.all(probes);
    let working = results.filter(r => r.ok).sort((a, b) => a.latency - b.latency);

    // If sk- key failed on OpenAI, try DeepSeek & Groq in case it's a DeepSeek or OpenRouter key
    if (working.length === 0 && testKey.startsWith('sk-') && providerId === 'openai') {
      const deepseekModels = PROVIDERS.deepseek.models;
      const dsProbes = deepseekModels.map(m => probeOne(m, 'deepseek'));
      const dsResults = await Promise.all(dsProbes);
      const dsWorking = dsResults.filter(r => r.ok).sort((a, b) => a.latency - b.latency);
      if (dsWorking.length > 0) {
        providerId = 'deepseek';
        this.setProvider('deepseek');
        return { provider: 'deepseek', all: dsResults, working: dsWorking };
      }
    }

    this.setProvider(providerId);
    return { provider: providerId, all: results, working };
  },

  /**
   * Helper to invoke AI with a system prompt and user text, expecting JSON
   */
  async callGemini(systemPrompt, userText) {
    return this._makeUniversalRequest(systemPrompt, userText);
  },


  /**
   * Use Gemini AI to parse and split addresses across any country (US, UK, Germany, Canada, etc.)
   */
  async parseAddressesWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const nonBlankLines = rawLines.map((line, idx) => ({ idx, line: String(line || '').trim() })).filter(item => item.line.length > 0);
    if (nonBlankLines.length === 0) {
      return rawLines.map((line, i) => ({
        lineNum: i + 1,
        original: line,
        cleaned: '',
        street: '',
        city: '',
        state: '',
        county: '',
        postal: '',
        country: '',
        status: 'empty',
        statusText: 'Blank',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert address parser with worldwide international knowledge (US, UK, Germany, Canada, France, Australia, Japan, etc.).
Parse each input address into an array of JSON objects matching this exact structure:
[
  {
    "lineNum": <int: 1-based original line index>,
    "street": "<street name & number, e.g. 10 Downing Street, 1908 Grand Avenue, 350 King Street West, Friedrichstraße 43>",
    "city": "<city or town, e.g. London, Nashville, Berlin, Toronto>",
    "state": "<state code or province code, e.g. TN, ON, CA, or empty string if not applicable>",
    "county": "<county or district name if present in appraisal records or UK counties, e.g. Davidson, Anchorage, Surrey, or empty string>",
    "postal": "<postal code, zip code, or PLZ, e.g. SW1A 2AA, 37212, 10117, M5V 3X5, or empty string>",
    "country": "<standard ISO 3166-1 alpha-2 two-letter country code in UPPERCASE, e.g. US for United States, GB for United Kingdom, DE for Germany, CA for Canada>"
  }
]

Strict Rules:
1. For country, ALWAYS output standard 2-letter ISO 3166-1 alpha-2 codes (e.g. US for United States, GB for United Kingdom, DE for Germany, CA for Canada, AU for Australia).
2. For US appraisal records with [Street], [City], [State], [County], [Postal], extract County into the "county" field (e.g. DAVIDSON in "1908 Grand Avenue,NASHVILLE,TN,DAVIDSON,37212").
3. For UK addresses, extract the building & street into "street" (e.g. "22 High Street"), the post town into "city" (e.g. "WITNEY", "London"), the county into "county" (e.g. "Oxfordshire", "Surrey"), the alphanumeric postcode into "postal" (e.g. "OX28 6RB", "SW1A 2AA"), and "GB" into "country".
4. For Germany addresses, extract the 5-digit PLZ (e.g. 10117) into "postal" and "DE" into "country".
5. For Canada addresses, extract the postal code (e.g. M5V 3X5) into "postal", province into "state", and "CA" into "country".
6. For Australia addresses, extract suburb into "city", state (NSW, VIC, QLD, WA, SA, TAS, ACT, NT) into "state", 4-digit postcode into "postal", and "AU" into "country".
7. Remove noise prefixes like "Unit 4, ", "No1 bldg, ", or trailing "#" from the street address.
8. Preserve number ranges with hyphens like "145-146 MIRAMAR BOULEVARD".`;

    const BATCH_SIZE = 50;
    const parsedArray = [];

    for (let i = 0; i < nonBlankLines.length; i += BATCH_SIZE) {
      const batch = nonBlankLines.slice(i, i + BATCH_SIZE);
      const userText = batch.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
      
      const textOutput = await this.callGemini(systemPrompt, userText);
      const batchParsed = this._extractJSONArray(textOutput);
      if (Array.isArray(batchParsed)) {
        parsedArray.push(...batchParsed);
      }

      // Delay between batches to respect Gemini Free Tier rate limits (15 requests/min)
      if (i + BATCH_SIZE < nonBlankLines.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Map back to original line order
    const casing = options.casing || 'titlecase';
    const countryFormat = options.countryFormat || 'iso2';
    const formatCase = (str) => {
      if (!str) return '';
      if (casing === 'uppercase') return str.toUpperCase();
      if (casing === 'titlecase') {
        let titled = str.toLowerCase().replace(/(^|\s|-|\/)([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
        return titled.replace(/\b(sw|nw|se|ne)\b/gi, m => m.toUpperCase());
      }
      return str;
    };

    const resultsMap = new Map();
    parsedArray.forEach(item => {
      const rawC = item.country || (options.defaultCountry || 'US');
      const formattedC = (typeof window !== 'undefined' && window.AddressSplitter)
        ? window.AddressSplitter.formatCountry(rawC, countryFormat)
        : rawC;

      resultsMap.set(item.lineNum, {
        street: formatCase(item.street || ''),
        city: formatCase(item.city || ''),
        state: (item.state || '').toUpperCase(),
        county: formatCase(item.county || ''),
        postal: (item.postal || '').toUpperCase(),
        country: formattedC
      });
    });

    const finalResults = rawLines.map((line, i) => {
      const lineNum = i + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          street: '',
          city: '',
          state: '',
          county: '',
          postal: '',
          country: '',
          status: 'empty',
          statusText: 'Blank',
          changed: false,
          aiEnhanced: false
        };
      }

      const hasAi = resultsMap.has(lineNum);
      const parsed = hasAi ? resultsMap.get(lineNum) : (window.AddressSplitter ? window.AddressSplitter.parseAddress(line, options) : {});
      const st = parsed.street || '';
      const ci = parsed.city || '';
      const sa = parsed.state || '';
      const co = parsed.county || '';
      const po = parsed.postal || '';
      const cu = parsed.country || '';

      return {
        lineNum,
        original: line,
        cleaned: `${st} \t ${ci} \t ${sa} \t ${co} \t ${po}${cu ? ' \t ' + cu : ''}`,
        street: st,
        city: ci,
        state: sa,
        county: co,
        postal: po,
        country: cu,
        status: (st || ci || po) ? 'assigned' : 'unchanged',
        statusText: (st || ci || po) ? (hasAi ? '✨ AI Parsed' : 'Cleaned') : 'Unchanged',
        changed: true,
        aiEnhanced: hasAi
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI address splits
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.original && (item.street || item.city || item.postal)) {
          learnItems.push({
            phrase: item.original,
            result: {
              street: item.street,
              city: item.city,
              state: item.state,
              county: item.county,
              postal: item.postal,
              country: item.country
            }
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('address', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Use Gemini AI to clean street column following user rules
   */
  async cleanStreetsWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const nonBlankLines = rawLines.map((line, idx) => ({ idx, line: String(line || '').trim() })).filter(item => item.line.length > 0);
    if (nonBlankLines.length === 0) {
      return rawLines.map((line, i) => ({
        lineNum: i + 1,
        original: line,
        cleaned: '',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI Street Cleaner.
Clean each address according to these strict rules:
1. Strip these 29 noise symbols: ,./<>?;':"|[]{}=+-_()#$%^&*@!
2. Strip these words: street, building, builfin, unit, st, bldg (case-insensitive).
3. Normalize building prefix like "Bldg 1 - 1521 Greens Road" to "521 GREENS ROAD".
4. For multi-addresses like "8901 Meadowbrook Blvd, 1401, 1405... and 1421 Randol Crossing Lane" take the first primary address "8901 MEADOWBROOK BLVD".
5. If "500 Malabar Road SW,Magnolia Cove Drive" take the first address "500 MALABAR ROAD SW".
6. STRICTLY PRESERVE hyphens in number ranges like "145-146 MIRAMAR BOULEVARD".
Output ONLY a JSON array: [{"lineNum": <int>, "cleaned": "<UPPERCASE cleaned street address>"}]`;

    const userText = nonBlankLines.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
    const textOutput = await this.callGemini(systemPrompt, userText);
    const parsedArray = this._extractJSONArray(textOutput);
    const resultsMap = new Map();
    if (Array.isArray(parsedArray)) {
      parsedArray.forEach(item => {
        if (item && item.lineNum !== undefined) {
          resultsMap.set(item.lineNum, item.cleaned);
        }
      });
    }

    return rawLines.map((line, i) => {
      const lineNum = i + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const hasAi = resultsMap.has(lineNum);
      const cleaned = hasAi ? resultsMap.get(lineNum) : (window.StreetCleaner ? window.StreetCleaner.cleanAddress(line, options) : trimmed);
      return {
        lineNum,
        original: line,
        cleaned: cleaned,
        changed: trimmed !== cleaned,
        status: trimmed === cleaned ? 'unchanged' : 'cleaned',
        statusText: trimmed === cleaned ? '✓ Valid' : (hasAi ? `✨ Cleaned (${cleaned})` : `Cleaned (${cleaned})`),
        aiEnhanced: hasAi
      };
    }).filter(Boolean);
  },

  /**
   * Classify Occupancy Description and Building Description into UNICEDE Touchstone Occupancy Class Code using Gemini 2.5
   */
  async classifyOccupancyWithAI(inputData, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');
    let rowsToProcess = [];

    if (inputData && typeof inputData === 'object' && !Array.isArray(inputData) && (inputData.existingCodes || inputData.bldgDescs || inputData.occDescs || inputData.extraCols || inputData.allCols)) {
      const codes = inputData.existingCodes || [];
      const bldgs = inputData.bldgDescs || [];
      const occs = inputData.occDescs || [];
      const extraCols = inputData.extraCols || [];
      const allCols = inputData.allCols || [];
      const maxLen = Math.max(codes.length, bldgs.length, occs.length, ...(extraCols.map(c => c.length)), ...(allCols.map(c => c.length)));

      for (let i = 0; i < maxLen; i++) {
        const rowExtra = extraCols.map(col => (col[i] || '').trim());
        rowsToProcess.push({
          idx: i,
          existingCode: (codes[i] || '').trim(),
          bldgDesc: (bldgs[i] || '').trim(),
          occDesc: (occs[i] || '').trim(),
          extraCols: rowExtra
        });
      }
    } else {
      const rawLines = Array.isArray(inputData) ? inputData : String(inputData || '').split(/\r\n|\r|\n/);
      rowsToProcess = rawLines.map((line, idx) => {
        const parsed = (typeof window !== 'undefined' && window.OccupancyClassifier)
          ? window.OccupancyClassifier.parseRow(line)
          : { existingCode: '', bldgDesc: '', occDesc: line };
        return {
          idx,
          existingCode: parsed.existingCode,
          bldgDesc: parsed.bldgDesc,
          occDesc: parsed.occDesc,
          extraCols: []
        };
      });
    }

    const nonBlankRows = rowsToProcess.filter(r => r.existingCode || r.bldgDesc || r.occDesc || (r.extraCols && r.extraCols.some(Boolean)));

    if (nonBlankRows.length === 0) {
      return rowsToProcess.map((r, i) => ({
        lineNum: i + 1,
        original: (r.allCols || []).join('\t').trim(),
        existingCode: '',
        bldgDesc: '',
        occDesc: '',
        extraCols: r.extraCols || [],
        allCols: r.allCols || [],
        occCode: '',
        category: '',
        status: 'empty',
        statusText: 'Blank',
        comparisonStatus: 'empty',
        comparisonMessage: 'Blank',
        cleaned: '',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI Insurance Occupancy Classifier.
You analyze commercial, residential, industrial, and institutional occupancy and building descriptions to assign the official UNICEDE® / AIR-Worldwide Touchstone Occupancy Class Code.

Key UNICEDE Touchstone Occupancy Code Schema:
- 300: Unknown occupancy
- 301: Permanent Dwelling: General Residential
- 302: Permanent Dwelling: Single Family (Dwellings, Family Homes)
- 303: Permanent Dwelling: Multi Family (Duplex, Triplex, Quadplex)
- 304: Temporary Lodging (Hotels, Motels, Resorts, Inns)
- 305: Group Institutional Housing (Nursing Homes, Convalescent Centers, Assisted Living, Independent Living, Extended Care, Dormitories, Residence Halls, Convents, Motherhouses)
- 306: Apartments / Condominiums
- 307: Terraced Housing / Townhomes
- 311: General Commercial
- 312: Retail Trade (Stores, Supermarkets, Malls, Strip Centers)
- 313: Wholesale Trade (Warehouses, Storage Facilities, Distribution Centers, Logistics)
- 314: Personal & Repair Services (Salons, Dry Cleaners, Laundromats)
- 315: Professional, Technical, Business Services (Offices, Banks, Financial, Law Firms)
- 316: Health Care Services (Hospitals, Clinics, Outpatient, Medical Offices)
- 317: Entertainment & Recreation (Theaters, Gyms, Arenas, Bowling, Stadiums, Basketball Courts, Volleyball Courts, Tennis Courts, Sports Complexes)
- 318: Parking Structures / Garages
- 319: Golf Courses
- 321: General Industrial
- 322: Heavy Fabrication and Assembly
- 323: Light Fabrication and Assembly
- 324: Food and Drug Processing
- 325: Chemical Processing
- 326: Metal Processing
- 327: High Technology (Data Centers, Cleanrooms)
- 328: Mining and Mineral Processing
- 329: Oil & Gas Refining / Petrochemical
- 330: Paper and Wood Products
- 331: Restaurant occupancy (Restaurants, Diners, Fast Food, Cafes, Bars & Grills)
- 335: Mercantile - Wholesale & Retail Wholesale
- 336: Automotive Repair Shops and Car Washes
- 341: Public Administration
- 342: Church / Religious Places of Worship (Churches, Ministries, Rectories, Cathedrals, Sanctuaries, Synagogues, Mosques, Temples, Dioceses, Parishes)
- 343: Government - General Services (Courthouses, City Halls, Post Offices)
- 344: Government - Emergency Services (Police, Fire, Ambulance Stations)
- 345: General Education
- 346: Primary and Secondary Schools / Colleges / Universities (High Schools, Elementary Schools, Middle Schools, Academies)
- 351: General Transportation
- 352: Rail Transportation
- 353: Airport Transportation / Terminals
- 354: Marine / Port Cargo Facilities
- 355: Aircraft Hangars
- 356: Bus Terminals
- 361: General Utilities
- 362: Water Supply / Treatment
- 363: Wastewater / Sewer Treatment
- 364: Electric Power Generation / Substation
- 365: Telecommunications / Cell Towers
- 366: Commercial Condominiums
- 367: Mobile Homes / Manufactured Housing
- 371: Miscellaneous / Vacant / Agricultural
- 382: Builder's Risk - Residential
- 383: Builder's Risk - Commercial
- 384: Builder's Risk - Industrial
- 400: Industrial Facility Occupancies
- 3001: Solar Occupancy / Solar Farms

Instructions:
1. For each line, analyze both "bldgDesc" (Building Description) and "occDesc" (Occupancy Description).
2. If "occDesc" contains percentages (e.g. 97%), the dominant percentage (>50%) or primary occupancy takes precedence.
3. Compare with "existingCode" (if provided):
   - If existingCode matches: confirmed.
   - If existingCode was 300 (Unknown) or differed: provide the accurate code.
4. Output ONLY a JSON array with one object per input line:
[{"lineNum": <int>, "occCode": "<string>", "category": "<string>"}]`;

    const userText = nonBlankRows.map(item => 
      `Line ${item.idx + 1}: ExistingCode="${item.existingCode}" | BuildingDesc="${item.bldgDesc}" | OccupancyDesc="${item.occDesc}"`
    ).join('\n');

    const textOutput = await this.callGemini(systemPrompt, userText);
    const parsedArray = this._extractJSONArray(textOutput);
    const resultsMap = new Map();
    if (Array.isArray(parsedArray)) {
      parsedArray.forEach(item => {
        if (item && item.lineNum !== undefined) {
          resultsMap.set(item.lineNum, {
            occCode: String(item.occCode || '300'),
            category: item.category || 'Unknown occupancy'
          });
        }
      });
    }

    const finalResults = rowsToProcess.map((row, i) => {
      const lineNum = i + 1;
      const extraCols = row.extraCols || [];
      const origParts = [row.existingCode, row.bldgDesc, row.occDesc, ...extraCols];
      const isAllBlank = !row.existingCode && !row.bldgDesc && !row.occDesc && (!row.extraCols || row.extraCols.every(e => !e));

      if (isAllBlank && options.removeEmptyLines) return null;

      if (isAllBlank) {
        return {
          lineNum,
          original: origParts.join('\t').trim(),
          existingCode: '',
          bldgDesc: '',
          occDesc: '',
          extraCols: extraCols,
          allCols: origParts,
          occCode: '',
          category: '',
          status: 'empty',
          statusText: 'Blank',
          comparisonStatus: 'empty',
          comparisonMessage: 'Blank',
          cleaned: '',
          changed: false,
          aiEnhanced: false
        };
      }

      const aiItem = resultsMap.get(lineNum);
      const ex = row.existingCode;

      if (aiItem) {
        let statusKey = 'assigned';
        let statusText = 'Assigned';
        if (ex) {
          if (ex === aiItem.occCode) {
            statusKey = 'match';
            statusText = `✓ Confirmed (${aiItem.occCode})`;
          } else if (ex === '300' && aiItem.occCode !== '300') {
            statusKey = 'upgraded';
            statusText = `✨ Resolved (300 ➔ ${aiItem.occCode})`;
          } else {
            statusKey = 'mismatch';
            statusText = `⚠️ Review (${ex} ➔ ${aiItem.occCode})`;
          }
        } else {
          statusKey = 'assigned';
          statusText = `✨ Assigned (${aiItem.occCode})`;
        }

        const cleanParts = [row.existingCode, row.bldgDesc, row.occDesc, ...extraCols, aiItem.occCode, aiItem.category].filter(Boolean);

        return {
          lineNum,
          original: origParts.join('\t').trim(),
          existingCode: row.existingCode,
          bldgDesc: row.bldgDesc,
          occDesc: row.occDesc,
          extraCols: extraCols,
          allCols: origParts,
          occCode: aiItem.occCode,
          category: aiItem.category,
          status: statusKey,
          statusText: statusText,
          comparisonStatus: statusKey,
          comparisonMessage: statusText,
          cleaned: cleanParts.join('\t'),
          changed: true,
          aiEnhanced: true
        };
      }

      const local = (typeof window !== 'undefined' && window.OccupancyClassifier)
        ? window.OccupancyClassifier.classifyRow(row.existingCode, row.bldgDesc, row.occDesc, extraCols)
        : { existingCode: row.existingCode, bldgDesc: row.bldgDesc, occDesc: row.occDesc, occCode: '300', category: 'Unknown occupancy', status: 'assigned', statusText: 'Assigned', comparisonStatus: 'assigned', comparisonMessage: 'Assigned' };

      const cleanParts = [local.existingCode, local.bldgDesc, local.occDesc, ...extraCols, local.occCode, local.category].filter(Boolean);

      return {
        lineNum,
        original: origParts.join('\t').trim(),
        existingCode: local.existingCode,
        bldgDesc: local.bldgDesc,
        occDesc: local.occDesc,
        extraCols: extraCols,
        allCols: origParts,
        occCode: local.occCode,
        category: local.category,
        status: local.status,
        statusText: local.statusText,
        comparisonStatus: local.status,
        comparisonMessage: local.statusText,
        cleaned: cleanParts.join('\t'),
        changed: true,
        aiEnhanced: false
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI classifications into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.occCode) {
          const phrase = [item.occDesc, item.bldgDesc].filter(Boolean).join(' ') || item.original;
          if (phrase) {
            learnItems.push({
              phrase,
              result: { code: item.occCode, category: item.category || '' }
            });
          }
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('occupancy', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Use Gemini AI to accurately classify structural engineering / construction descriptions into Touchstone UNICEDE Construction Codes
   */
  async classifyConstructionWithAI(inputPayload, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    let rowsToProcess = [];
    if (inputPayload && typeof inputPayload === 'object' && !Array.isArray(inputPayload) && (inputPayload.existingCodes || inputPayload.bldgDescs || inputPayload.conDescs || inputPayload.extraCols || inputPayload.allCols)) {
      const codes = inputPayload.existingCodes || [];
      const bldgs = inputPayload.bldgDescs || [];
      const cons = inputPayload.conDescs || [];
      const extraCols = inputPayload.extraCols || [];
      const allCols = inputPayload.allCols || [];
      const maxLen = Math.max(codes.length, bldgs.length, cons.length, ...(extraCols.map(c => c.length)), ...(allCols.map(c => c.length)));
      for (let i = 0; i < maxLen; i++) {
        const rowExtra = extraCols.map(col => (col[i] || '').trim());
        rowsToProcess.push({
          idx: i,
          existingCode: (codes[i] || '').trim(),
          bldgDesc: (bldgs[i] || '').trim(),
          conDesc: (cons[i] || '').trim(),
          extraCols: rowExtra
        });
      }
    } else {
      const lines = typeof inputPayload === 'string' ? inputPayload.split(/\r\n|\r|\n/) : inputPayload;
      rowsToProcess = lines.map((line, idx) => {
        const row = (typeof window !== 'undefined' && window.ConstructionClassifier)
          ? window.ConstructionClassifier.parseRow(line)
          : { existingCode: '', bldgDesc: '', conDesc: String(line || '').trim() };
        return {
          idx,
          existingCode: row.existingCode,
          bldgDesc: row.bldgDesc,
          conDesc: row.conDesc,
          extraCols: []
        };
      });
    }

    const nonBlankRows = rowsToProcess.filter(r => r.existingCode || r.bldgDesc || r.conDesc || (r.extraCols && r.extraCols.some(Boolean)));
    if (nonBlankRows.length === 0) {
      return rowsToProcess.map((r, i) => ({
        lineNum: i + 1,
        original: (r.allCols || []).join('\t').trim(),
        existingCode: '',
        bldgDesc: '',
        conDesc: '',
        extraCols: r.extraCols || [],
        allCols: r.allCols || [],
        conCode: '',
        category: '',
        group: '',
        status: 'empty',
        statusText: 'Blank',
        comparisonStatus: 'empty',
        comparisonMessage: 'Blank',
        cleaned: '',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert structural engineering and property appraisal analyst specialized in Verisk Touchstone UNICEDE® Construction Class Codes.
Map each building and construction description to its official Verisk Touchstone construction code:

Primary Reference Schema:
- 100: Unknown construction
- 101: Wood Frame (Modern) (stud wall, stick built, detached single/multi-family)
- 102: Light Wood Frame (studless, light timber trusses)
- 103: Masonry Veneer (wood-framed faced with single wythe of brick/stone)
- 104: Heavy Timber (mill construction, masonry walls with heavy wood columns, glulam)
- 107: Lightweight Cladding (fiber cement, light gauge steel support)
- 111: Masonry (exterior masonry walls, general brick/block)
- 112: Adobe (adobe clay blocks, mud mortar)
- 113: Rubble Stone Masonry (irregular stones in cement mortar)
- 114: Unreinforced Masonry - Bearing Wall (URM, unreinforced brick, load bearing)
- 115: Unreinforced Masonry - Bearing Frame (URM infill walls)
- 116: Reinforced Masonry (load bearing reinforced brick or CMU concrete block)
- 117: Reinforced Masonry Shear Wall with MRF
- 118: Reinforced Masonry Shear Wall without MRF
- 119: Joisted Masonry (JM, masonry exterior walls with combustible wood floor/roof joists)
- 120: Confined Masonry (masonry confined by tie-columns/beams)
- 131: Reinforced Concrete (RC, poured/cast-in-place concrete columns and beams)
- 132: Reinforced Concrete Shear Wall with MRF
- 133: Reinforced Concrete Shear Wall without MRF (concrete box system)
- 134: Reinforced Concrete MRF - Ductile (ductile moment resisting frame)
- 135: Reinforced Concrete MRF - Non-Ductile
- 136: Tilt-Up (reinforced concrete wall panels cast on ground and tilted up)
- 137: Pre-cast Concrete (prefabricated post and beam concrete frame)
- 138: Pre-cast Concrete with Shear Wall
- 139: Reinforced Concrete MRF
- 151: Steel (structural steel columns and beams)
- 152: Light Metal (pre-engineered metal building / PEMB, light gauge steel, corrugated siding/shed)
- 153: Braced Steel Frame (steel braced with diagonal members)
- 154: Steel MRF - Perimeter
- 155: Steel MRF - Distributed
- 156: Steel MRF (moment resisting frame)
- 157: Steel Frame with URM infill
- 158: Steel Frame with Concrete Shear Wall
- 159: Steel Reinforced Concrete (SRC, encased steel)
- 160: Steel Long Span (trussed arches, column-free spaces >100 ft)
- 191: Mobile Homes / Manufactured Housing
- 192: Mobile Home (permanent foundation)
- 193: Mobile Home (tied down)
- 194: Mobile Home (not tied down)
- 201: Suspension Bridge
- 202: Truss Bridge
- 203: Major Bridge
- 221: Storage Tank
- 227: Underground Pipeline
- 228: At Grade Pipeline
- 231: Chimney
- 234: Tower (communication, lattice)
- 500: Solar, rooftop (unknown anchorage)
- 501: Solar, rooftop, anchored (flush mounted/anchored)
- 502: Solar, rooftop, ballasted (flat roof ballasted)
- 510: Solar ground mounted (tracker or fixed)
- 513: Solar ground mounted, fixed tilt
- 514: BESS (battery energy storage system)

Instructions:
1. Analyze both "bldgDesc" (Building Description) and "conDesc" (Construction / Exterior Wall Finish / Material Description).
2. Construction description ("conDesc") takes primary priority for structural framing and materials.
3. UNDERWRITING RULE FOR EXTERIOR WALL FINISH / WALL MATERIALS:
   - If Exterior Wall Finish is STONE (or stone facade, stone finish, stone wall, stone masonry, fieldstone) -> ALWAYS assign Construction Code 113 (Rubble Stone Masonry).
   - If Exterior Wall Finish is BRICK (or brick finish, exterior brick, brick wall, general brick/masonry) -> ALWAYS assign Construction Code 111 (Masonry).
4. ISO COMMERCIAL FIRE / CONSTRUCTION CLASS UNDERWRITING RULES:
   - ISO 1 (Frame) -> ALWAYS assign Construction Code 101 (Wood Frame Modern).
   - ISO 2 (Joisted Masonry) -> ALWAYS assign Construction Code 119 (Joisted Masonry).
   - ISO 3 (Noncombustible) -> ALWAYS assign Construction Code 152 (Light Metal / Non-Combustible).
   - ISO 4 (Masonry Noncombustible) -> ALWAYS assign Construction Code 111 (Masonry).
   - ISO 5 (Modified Fire Resistive) -> ALWAYS assign Construction Code 131 (Reinforced Concrete / MFR).
   - ISO 6 (Fire Resistive) -> ALWAYS assign Construction Code 131 (Reinforced Concrete / FR).
5. If existingCode was 100 (Unknown) or differed: provide the accurate code, category, and group.
6. Output ONLY a JSON array with one object per input line:
[{"lineNum": <int>, "conCode": "<string>", "category": "<string>", "group": "<string>"}]`;

    const userText = nonBlankRows.map(item => {
      const extraStr = (item.extraCols && item.extraCols.length > 0 && item.extraCols.some(Boolean)) ? ` | ExtraCols="${item.extraCols.join('; ')}"` : '';
      return `Line ${item.idx + 1}: ExistingCode="${item.existingCode}" | BuildingDesc="${item.bldgDesc}" | ConstructionDesc="${item.conDesc}"${extraStr}`;
    }).join('\n');

    const textOutput = await this.callGemini(systemPrompt, userText);
    const parsedArray = this._extractJSONArray(textOutput);
    const resultsMap = new Map();
    if (Array.isArray(parsedArray)) {
      parsedArray.forEach(item => {
        if (item && item.lineNum !== undefined) {
          resultsMap.set(item.lineNum, {
            conCode: String(item.conCode || '100'),
            category: item.category || 'Unknown',
            group: item.group || 'Unknown construction'
          });
        }
      });
    }

    const finalResults = rowsToProcess.map((row, i) => {
      const lineNum = i + 1;
      const extraCols = row.extraCols || [];
      const origParts = [row.existingCode, row.bldgDesc, row.conDesc, ...extraCols];
      const isAllBlank = !row.existingCode && !row.bldgDesc && !row.conDesc && (!row.extraCols || row.extraCols.every(e => !e));

      if (isAllBlank && options.removeEmptyLines) return null;

      if (isAllBlank) {
        return {
          lineNum,
          original: origParts.join('\t').trim(),
          existingCode: '',
          bldgDesc: '',
          conDesc: '',
          extraCols: extraCols,
          allCols: origParts,
          conCode: '',
          category: '',
          group: '',
          status: 'empty',
          statusText: 'Blank',
          comparisonStatus: 'empty',
          comparisonMessage: 'Blank',
          cleaned: '',
          changed: false,
          aiEnhanced: false
        };
      }

      const aiItem = resultsMap.get(lineNum);
      const ex = row.existingCode;

      if (aiItem) {
        let statusKey = 'assigned';
        let statusText = 'Assigned';
        if (ex) {
          if (ex === aiItem.conCode) {
            statusKey = 'match';
            statusText = `✓ Confirmed (${aiItem.conCode})`;
          } else if (ex === '100' && aiItem.conCode !== '100') {
            statusKey = 'upgraded';
            statusText = `✨ Resolved (100 ➔ ${aiItem.conCode})`;
          } else {
            statusKey = 'mismatch';
            statusText = `⚠️ Review (${ex} ➔ ${aiItem.conCode})`;
          }
        } else {
          statusKey = 'assigned';
          statusText = `✨ Assigned (${aiItem.conCode})`;
        }

        const cleanParts = [row.existingCode, row.bldgDesc, row.conDesc, ...extraCols, aiItem.conCode, aiItem.category].filter(Boolean);

        return {
          lineNum,
          original: origParts.join('\t').trim(),
          existingCode: row.existingCode,
          bldgDesc: row.bldgDesc,
          conDesc: row.conDesc,
          extraCols: extraCols,
          allCols: origParts,
          conCode: aiItem.conCode,
          category: aiItem.category,
          group: aiItem.group,
          status: statusKey,
          statusText: statusText,
          comparisonStatus: statusKey,
          comparisonMessage: statusText,
          cleaned: cleanParts.join('\t'),
          changed: true,
          aiEnhanced: true
        };
      }

      const local = (typeof window !== 'undefined' && window.ConstructionClassifier)
        ? window.ConstructionClassifier.classifyRow(row.existingCode, row.bldgDesc, row.conDesc, extraCols)
        : { existingCode: row.existingCode, bldgDesc: row.bldgDesc, conDesc: row.conDesc, conCode: '100', category: 'Unknown', group: 'Unknown construction', status: 'assigned', statusText: 'Assigned', comparisonStatus: 'assigned', comparisonMessage: 'Assigned' };

      const cleanParts = [local.existingCode, local.bldgDesc, local.conDesc, ...extraCols, local.conCode, local.category].filter(Boolean);

      return {
        lineNum,
        original: origParts.join('\t').trim(),
        existingCode: local.existingCode,
        bldgDesc: local.bldgDesc,
        conDesc: local.conDesc,
        extraCols: extraCols,
        allCols: origParts,
        conCode: local.conCode,
        category: local.category,
        group: local.group,
        status: local.status,
        statusText: local.statusText,
        comparisonStatus: local.status,
        comparisonMessage: local.statusText,
        cleaned: cleanParts.join('\t'),
        changed: true,
        aiEnhanced: false
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI classifications into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.conCode) {
          const phrase = [item.conDesc, item.bldgDesc].filter(Boolean).join(' ') || item.original;
          if (phrase) {
            learnItems.push({
              phrase,
              result: { code: item.conCode, category: item.category || '', group: item.group || '' }
            });
          }
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('construction', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Use Gemini AI to classify exterior wall finish data into WallType and WallSiding
   */
  async cleanWallsWithAI(rawLines, options = {}) {
    if (!rawLines || rawLines.length === 0) return [];
    const validLines = rawLines.map((l, idx) => ({ lineNum: idx + 1, text: String(l || '').trim() })).filter(x => x.text.length > 0);
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        wallType: '—',
        wallTypeCode: '',
        wallTypeName: '',
        wallTypeShort: '',
        wallSiding: '—',
        wallSidingCode: '',
        wallSidingName: '',
        wallSidingShort: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert structural engineering and property cat modeling analyst specialized in Verisk Touchstone UNICEDE® Location Wall Detail Fields.
Your goal is to parse and classify each exterior wall input line into the 9 Touchstone Location Wall Detail fields:
1. "wallTypeCode": The structural or backing wall material code (0 to 9)
2. "wallSidingCode": The weather protection, siding, or exterior cladding material code (0 to 8)
3. "glassTypeCode": The type of glass used (0 to 5)
4. "glassPercentageCode": The percentage of wall area covered by glass (0 to 4)
5. "windowProtectionCode": The wind/impact window protection system (0 to 3)
6. "exteriorDoorsCode": Exterior door type and reinforcement (0 to 6)
7. "buildingOpeningCode": Percentage of exterior walls that are open (0 to 2)
8. "brickVeneerCode": Percentage of exterior walls that are brick veneer (0 to 3)
9. "fireRatingCode": Fire rating for wall siding (0 to 3)

TOUCHSTONE UNICEDE WALL DETAIL SPECIFICATIONS:

Field 1: WallType (Codes 0 to 9):
- 0: Unknown/default
- 1: Brick/unreinforced masonry (URM, solid brick bearing)
- 2: Reinforced masonry (RM, CMU concrete block with rebar)
- 3: Plywood (wood frame sheathing, plywood, CDX)
- 4: Wood planks (wood boards, tongue-and-groove T&G)
- 5: Particle board/OSB (oriented strand board, waferboard)
- 6: Metal panels (light gauge steel panels, corrugated steel)
- 7: Pre-cast concrete elements (tilt-up, precast panels)
- 8: Cast-in-place concrete (poured concrete, reinforced concrete monolithic)
- 9: Gypsum board (exterior gypsum sheathing, DensGlass)

Field 2: WallSiding (Codes 0 to 8):
- 0: Unknown/default
- 1: Veneer brick/masonry (brick veneer, masonry veneer, face brick)
- 2: Wood shingles (wood shingles, cedar shakes)
- 3: Clapboards (wood clapboard, lap siding, bevel siding)
- 4: Aluminum/vinyl siding (vinyl siding, aluminum siding, PVC, metal siding)
- 5: Stone panels (natural stone, granite panels, limestone)
- 6: Exterior insulation finishing system (EIFS, synthetic stucco, Dryvit)
- 7: Stucco (traditional cement stucco / plaster)
- 8: Fiber cement board (HardiePlank, James Hardie, cementitious)

Field 3: Glass Type (Codes 0 to 5):
- 0: Unknown/default
- 1: Annealed (float glass, standard plate glass)
- 2: Tempered (safety glass, toughened)
- 3: Heat strengthened (semi-tempered, HS glass)
- 4: Laminated (impact laminated glass, hurricane glass, PVB)
- 5: Insulating glass units (IGU, double/triple pane, dual glazed)

Field 4: Glass Percentage (Codes 0 to 4):
- 0: Unknown/default
- 1: Less than 5% (< 5% glass area)
- 2: Between 5% and 20% (5%–20% glass area)
- 3: Between 20% and 60% (20%–60% glass area)
- 4: Greater than 60% (> 60% glass area, curtain wall, all-glass facade)

Field 5: Window Protection (Codes 0 to 3):
- 0: Unknown/default
- 1: No protection (unprotected windows)
- 2: Non-engineered shutters (plywood covers, storm panels uncertified)
- 3: Engineered shutters (Miami-Dade certified, roll-down hurricane shutters)

Field 6: Exterior Doors (Codes 0 to 6):
- 0: Unknown/default
- 1: Single width doors (standard single entry door)
- 2: Double width doors (standard double/french doors)
- 3: Reinforced single width doors (impact rated single door)
- 4: Reinforced double width doors (impact rated double doors)
- 5: Sliding doors (standard patio slider)
- 6: Reinforced sliding doors (impact rated heavy-duty sliding glass doors)

Field 7: Building Exterior Opening (Codes 0 to 2):
- 0: Unknown
- 1: Less than 50% of wall open / default
- 2: More than 50% of wall open (large window walls, open storefront)

Field 8: Brick Veneer (Codes 0 to 3):
- 0: Unknown/default (represents 50-90%)
- 1: More than 90% (> 90% brick veneer)
- 2: 25-50% (25% to 50% brick veneer)
- 3: 0-25% (0% to 25% brick veneer)

Field 9: Fire Rating for Wall Siding (Codes 0 to 3):
- 0: Unknown/No Rating
- 1: Fire Rated Class A (Class A flame spread index 0-25, non-combustible)
- 2: Fire Rated Class B (Class B flame spread index 26-75, treated wood)
- 3: Fire Rated Class C (Class C flame spread index 76-200, untreated siding)

UNDERWRITING RULES:
1. With Percentages: If explicit percentages are provided (e.g. 70% Brick, 30% Vinyl), pick the material with the HIGHER percentage (Brick 1).
2. Without Percentages: If multiple materials are listed without percentages (e.g. Brick Veneer and Vinyl Siding), pick the WEAKER material (Vinyl Siding 4 is weaker than Brick Veneer 1).
3. Equal Percentages (50% / 50% Tie): If two materials have equal percentages, pick the WEAKER material.
4. Default unspecified fields to "0".

OUTPUT FORMAT:
Output ONLY a JSON array of objects:
[{"lineNum": <int>, "wallTypeCode": "<code 0-9>", "wallSidingCode": "<code 0-8>", "glassTypeCode": "<code 0-5>", "glassPercentageCode": "<code 0-4>", "windowProtectionCode": "<code 0-3>", "exteriorDoorsCode": "<code 0-6>", "buildingOpeningCode": "<code 0-2>", "brickVeneerCode": "<code 0-3>", "fireRatingCode": "<code 0-3>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(item.lineNum, item);
        }
      });
    }

    const WallTaxonomy = window.WallTaxonomy || (window.WallClassifier && window.WallClassifier.taxonomy);
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          wallType: '—',
          wallTypeCode: '',
          wallTypeName: '',
          wallTypeShort: '',
          wallSiding: '—',
          wallSidingCode: '',
          wallSidingName: '',
          wallSidingShort: '',
          glassTypeCode: '0',
          glassPercentageCode: '0',
          windowProtectionCode: '0',
          exteriorDoorsCode: '0',
          buildingOpeningCode: '0',
          brickVeneerCode: '0',
          fireRatingCode: '0',
          recognizedCount: 0,
          status: 'empty',
          statusText: 'Blank',
          changed: false,
          aiEnhanced: false
        };
      }

      const local = window.WallClassifier ? window.WallClassifier.parseWallRow(line, options) : {};
      const aiItem = aiMap.get(lineNum);

      let wallTypeCode = local.wallTypeCode || '0';
      let wallSidingCode = local.wallSidingCode || '0';
      let glassTypeCode = local.glassTypeCode || '0';
      let glassPercentageCode = local.glassPercentageCode || '0';
      let windowProtectionCode = local.windowProtectionCode || '0';
      let exteriorDoorsCode = local.exteriorDoorsCode || '0';
      let buildingOpeningCode = local.buildingOpeningCode || '0';
      let brickVeneerCode = local.brickVeneerCode || '0';
      let fireRatingCode = local.fireRatingCode || '0';
      let aiEnhanced = false;

      if (aiItem) {
        if (aiItem.wallTypeCode !== undefined && aiItem.wallTypeCode !== null) {
          wallTypeCode = String(aiItem.wallTypeCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.wallSidingCode !== undefined && aiItem.wallSidingCode !== null) {
          wallSidingCode = String(aiItem.wallSidingCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.glassTypeCode !== undefined && aiItem.glassTypeCode !== null) {
          glassTypeCode = String(aiItem.glassTypeCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.glassPercentageCode !== undefined && aiItem.glassPercentageCode !== null) {
          glassPercentageCode = String(aiItem.glassPercentageCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.windowProtectionCode !== undefined && aiItem.windowProtectionCode !== null) {
          windowProtectionCode = String(aiItem.windowProtectionCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.exteriorDoorsCode !== undefined && aiItem.exteriorDoorsCode !== null) {
          exteriorDoorsCode = String(aiItem.exteriorDoorsCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.buildingOpeningCode !== undefined && aiItem.buildingOpeningCode !== null) {
          buildingOpeningCode = String(aiItem.buildingOpeningCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.brickVeneerCode !== undefined && aiItem.brickVeneerCode !== null) {
          brickVeneerCode = String(aiItem.brickVeneerCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.fireRatingCode !== undefined && aiItem.fireRatingCode !== null) {
          fireRatingCode = String(aiItem.fireRatingCode).trim();
          aiEnhanced = true;
        }
      }

      const wallTypeObj = WallTaxonomy?.WALL_TYPE?.[wallTypeCode];
      const wallSidingObj = WallTaxonomy?.WALL_SIDING?.[wallSidingCode];
      const glassTypeObj = WallTaxonomy?.GLASS_TYPE?.[glassTypeCode];
      const glassPctObj = WallTaxonomy?.GLASS_PERCENTAGE?.[glassPercentageCode];
      const winProtObj = WallTaxonomy?.WINDOW_PROTECTION?.[windowProtectionCode];
      const extDoorsObj = WallTaxonomy?.EXTERIOR_DOORS?.[exteriorDoorsCode];
      const bOpenObj = WallTaxonomy?.BUILDING_EXTERIOR_OPENING?.[buildingOpeningCode];
      const bVenObj = WallTaxonomy?.BRICK_VENEER?.[brickVeneerCode];
      const fRateObj = WallTaxonomy?.FIRE_RATING_WALL_SIDING?.[fireRatingCode];

      let wallTypeDisplay = wallTypeCode;
      if (wallTypeObj) {
        if (format === 'name_only') wallTypeDisplay = wallTypeObj.name;
        else if (format === 'name_code') wallTypeDisplay = `${wallTypeObj.name} (${wallTypeObj.code})`;
        else if (format === 'short_code') wallTypeDisplay = `${wallTypeObj.shortName} (${wallTypeObj.code})`;
      }

      let wallSidingDisplay = wallSidingCode;
      if (wallSidingObj) {
        if (format === 'name_only') wallSidingDisplay = wallSidingObj.name;
        else if (format === 'name_code') wallSidingDisplay = `${wallSidingObj.name} (${wallSidingObj.code})`;
        else if (format === 'short_code') wallSidingDisplay = `${wallSidingObj.shortName} (${wallSidingObj.code})`;
      }

      let recCount = (wallTypeCode && wallTypeCode !== '0' ? 1 : 0) + (wallSidingCode && wallSidingCode !== '0' ? 1 : 0);
      if (glassTypeCode !== '0') recCount++;
      if (glassPercentageCode !== '0') recCount++;
      if (windowProtectionCode !== '0') recCount++;
      if (exteriorDoorsCode !== '0') recCount++;
      if (buildingOpeningCode !== '0') recCount++;
      if (brickVeneerCode !== '0') recCount++;
      if (fireRatingCode !== '0') recCount++;

      return {
        lineNum,
        original: line,
        cleaned: `${wallTypeCode}\t${wallSidingCode}`,
        wallType: wallTypeDisplay,
        wallTypeCode: wallTypeCode,
        wallTypeName: wallTypeObj ? wallTypeObj.name : '',
        wallTypeShort: wallTypeObj ? wallTypeObj.shortName : '',
        wallSiding: wallSidingDisplay,
        wallSidingCode: wallSidingCode,
        wallSidingName: wallSidingObj ? wallSidingObj.name : '',
        wallSidingShort: wallSidingObj ? wallSidingObj.shortName : '',
        glassType: glassTypeCode !== '0' ? (glassTypeObj ? `${glassTypeObj.name} (${glassTypeCode})` : glassTypeCode) : '0',
        glassTypeCode,
        glassTypeName: glassTypeObj ? glassTypeObj.name : 'Unknown/default',
        glassTypeShort: glassTypeObj ? glassTypeObj.shortName : 'Unknown',
        glassPercentage: glassPercentageCode !== '0' ? (glassPctObj ? `${glassPctObj.name} (${glassPercentageCode})` : glassPercentageCode) : '0',
        glassPercentageCode,
        glassPercentageName: glassPctObj ? glassPctObj.name : 'Unknown/default',
        glassPercentageShort: glassPctObj ? glassPctObj.shortName : 'Unknown',
        windowProtection: windowProtectionCode !== '0' ? (winProtObj ? `${winProtObj.name} (${windowProtectionCode})` : windowProtectionCode) : '0',
        windowProtectionCode,
        windowProtectionName: winProtObj ? winProtObj.name : 'Unknown/default',
        windowProtectionShort: winProtObj ? winProtObj.shortName : 'Unknown',
        exteriorDoors: exteriorDoorsCode !== '0' ? (extDoorsObj ? `${extDoorsObj.name} (${exteriorDoorsCode})` : exteriorDoorsCode) : '0',
        exteriorDoorsCode,
        exteriorDoorsName: extDoorsObj ? extDoorsObj.name : 'Unknown/default',
        exteriorDoorsShort: extDoorsObj ? extDoorsObj.shortName : 'Unknown',
        buildingOpening: buildingOpeningCode !== '0' ? (bOpenObj ? `${bOpenObj.name} (${buildingOpeningCode})` : buildingOpeningCode) : '0',
        buildingOpeningCode,
        buildingOpeningName: bOpenObj ? bOpenObj.name : 'Unknown',
        buildingOpeningShort: bOpenObj ? bOpenObj.shortName : 'Unknown',
        brickVeneer: brickVeneerCode !== '0' ? (bVenObj ? `${bVenObj.name} (${brickVeneerCode})` : brickVeneerCode) : '0',
        brickVeneerCode,
        brickVeneerName: bVenObj ? bVenObj.name : 'Unknown/default',
        brickVeneerShort: bVenObj ? bVenObj.shortName : 'Unknown',
        fireRating: fireRatingCode !== '0' ? (fRateObj ? `${fRateObj.name} (${fireRatingCode})` : fireRatingCode) : '0',
        fireRatingCode,
        fireRatingName: fRateObj ? fRateObj.name : 'Unknown/No Rating',
        fireRatingShort: fRateObj ? fRateObj.shortName : 'Unknown',
        recognizedCount: recCount,
        status: recCount >= 2 ? 'match' : (recCount > 0 ? 'assigned' : 'mismatch'),
        statusText: recCount >= 2 ? `✓ Complete (${recCount} Wall Fields Identified)` : (recCount > 0 ? `Separated (${recCount} Wall Fields)` : '⚠️ Unrecognized Wall Format'),
        changed: true,
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI wall classifications into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && (item.wallTypeCode || item.wallSidingCode)) {
          if (item.original) {
            learnItems.push({
              phrase: item.original,
              result: { wallTypeCode: item.wallTypeCode, wallSidingCode: item.wallSidingCode }
            });
          }
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('wall', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Use Gemini AI to parse and classify roof descriptions into 7 Touchstone UNICEDE® Roof Detail Fields:
   * 1. Roof Geometry (0–10)
   * 2. Roof Pitch (0–3)
   * 3. Roof Covering (0–12)
   * 4. Roof Deck (0–8)
   * 5. Roof Covering Attachment (0–4)
   * 6. Roof Deck Attachment (0–7)
   * 7. Roof Anchorage (0–7)
   */
  async classifyRoofWithAI(rawLines, options = {}) {
    if (!rawLines || rawLines.length === 0) return [];
    const validLines = rawLines.map((l, idx) => ({ lineNum: idx + 1, text: String(l || '').trim() })).filter(x => x.text.length > 0);
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        geometry: '—',
        geometryCode: '',
        geometryName: '',
        geometryShort: '',
        pitch: '—',
        pitchCode: '',
        pitchName: '',
        pitchShort: '',
        covering: '—',
        coveringCode: '',
        coveringName: '',
        coveringShort: '',
        deck: '—',
        deckCode: '',
        deckName: '',
        deckShort: '',
        covAttach: '—',
        covAttachCode: '',
        covAttachName: '',
        covAttachShort: '',
        coveringAttachment: '—',
        coveringAttachmentCode: '',
        deckAttach: '—',
        deckAttachCode: '',
        deckAttachName: '',
        deckAttachShort: '',
        deckAttachment: '—',
        deckAttachmentCode: '',
        anchorage: '—',
        anchorageCode: '',
        anchorageName: '',
        anchorageShort: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert structural engineering and catastrophe risk modeling analyst specialized in Verisk Touchstone UNICEDE® Roof Detail Fields.
Your goal is to parse and classify each roof input line into seven Touchstone fields:
1. "geometryCode": Roof Geometry code (0 to 10)
2. "pitchCode": Roof Pitch code (0 to 3)
3. "coveringCode": Roof Covering code (0 to 12)
4. "deckCode": Roof Deck code (0 to 8)
5. "covAttachCode": Roof Covering Attachment code (0 to 4)
6. "deckAttachCode": Roof Deck Attachment code (0 to 7)
7. "anchorageCode": Roof Anchorage code (0 to 7)

TOUCHSTONE UNICEDE ROOF DETAIL SPECIFICATIONS:

Field 1: Roof Geometry (Codes 0 to 10):
- 0: Unknown/default
- 1: Flat (flat, zero pitch, horizontal, low slope)
- 2: Gable end without bracing (unbraced gable, pitched gable, A-frame, gable end)
- 3: Hip (hipped, full hip, dutch hip)
- 4: Complex (multi-gable, cross-gable, irregular, combination, custom geometry, dome, turret)
- 5: Stepped (terraced, clerestory, sawtooth)
- 6: Shed (skillion, mono-pitch, single pitch, single slope, lean-to)
- 7: Mansard (french roof, curb roof)
- 8: Gable end with bracing (gable braced, reinforced gable, strapped gable)
- 9: Pyramid (pyramidal, pavilion roof)
- 10: Gambrel (barn roof, dutch roof)

Field 2: Roof Pitch (Codes 0 to 3):
- 0: Unknown/default
- 1: Low (less than 10° or <= 2:12 ratio, shallow pitch, nearly flat)
- 2: Medium (10° to 30° or 3:12 to 7:12 ratio, moderate pitch, standard pitch)
- 3: High (more than 30° or >= 8:12 ratio, steep pitch, high slope)

Field 3: Roof Covering (Codes 0 to 12):
- 0: Unknown/default
- 1: Asphalt shingles (composition, 3-tab, architectural, fiberglass, laminate)
- 2: Wooden shingles (wood shakes, cedar shingles/shakes)
- 3: Clay/concrete tiles (spanish tiles, barrel tiles, terra cotta, mission tiles, cement tiles, S-tile)
- 4: Light metal panels (corrugated metal/steel/iron, tin roof, R-panel, 5V crimp, light metal, steel roofing)
- 5: Slate (natural slate, Vermont slate)
- 6: Built-up roof with gravel (BUR with gravel, tar and gravel, asphalt and gravel, pea gravel)
- 7: Single-ply membrane (single-ply, single ply, 1-ply, EPDM, TPO, PVC, rubber membrane, adhered membrane, thermoplastic)
- 8: Standing seam metal roofs (standing seam metal/steel/aluminum, SSMR, architectural standing seam)
- 9: Built-up roof without gravel (smooth BUR, modified bitumen, mod-bit, SBS, APP, torch-down, roll roofing, cap sheet)
- 10: Single-ply membrane ballasted (ballasted single-ply, gravel ballasted EPDM/TPO/PVC)
- 11: Hurricane Wind-Rated Roof Coverings (Miami-Dade NOA, FM 1-90, FM 1-120, TAS 106, UL 580)
- 12: Photovoltaic (solar roof, solar shingles, rooftop solar panels, BIPV)

Field 4: Roof Deck (Codes 0 to 8):
- 0: Unknown/default
- 1: Plywood (CDX, wood sheathing, ply deck)
- 2: Wood planks (wooden planks, tongue-and-groove T&G, timber deck)
- 3: Particle board/OSB (oriented strand board, waferboard, aspenite, chipboard)
- 4: Metal deck with insulation board (steel deck with insulation, B-deck w/ polyiso/rigid board)
- 5: Metal deck with concrete (composite steel deck with concrete topping, LWC on metal deck)
- 6: Pre-cast concrete slabs (precast concrete, hollow-core slabs, precast planks, double tee)
- 7: Reinforced concrete slabs (cast-in-place concrete, CIP, poured concrete, monolithic concrete deck)
- 8: Light metal (bare metal deck, light gauge steel deck, uninsulated corrugated metal deck)

Field 5: Roof Covering Attachment (Codes 0 to 4):
- 0: Unknown/default
- 1: Screws (mechanical screws, self-tapping screws, stress plates with screws)
- 2: Nails/staples (roofing nails, ring-shank nails, staples, wire staples)
- 3: Adhesive/epoxy (fully adhered, foam adhesive, tile adhesive, cold adhesive, hot asphalt, epoxy bonded)
- 4: Mortar (mortar set, mud set tile, cement mortar bed)

Field 6: Roof Deck Attachment (Codes 0 to 7):
- 0: Unknown/default
- 1: Screws/bolts (deck screws, lag bolts, through bolts)
- 2: Nails (generic deck nails, face nailed)
- 3: Adhesive/epoxy (decking adhesive, subfloor glue, foam adhesive)
- 4: Structurally connected (welded metal deck, puddle welds, shear studs, monolithic concrete tie)
- 5: 6d nails @ 6 spacing, 12 on center (6d @ 6/12)
- 6: 8d nails @ 6 spacing, 12 on center (8d @ 6/12 standard enhanced)
- 7: 8d nails @ 6 spacing, 6 on center (8d @ 6/6 HVHZ / Miami-Dade)

Field 7: Roof Anchorage (Codes 0 to 7):
- 0: Unknown/default
- 1: Hurricane Ties (hurricane straps, hurricane clips, seismic ties, uplift straps)
- 2: Nails/Screws (toe-nailing, nails, screws)
- 3: Anchor bolts (through bolts, expansion bolts, anchor bolted)
- 4: Gravity/friction (unanchored, dead load only, friction only)
- 5: Adhesive epoxy (chemical anchor, structural adhesive, epoxy)
- 6: Structurally Connected (monolithic concrete tie beam, welded, bond beam)
- 7: Clips (framing clips, metal clips, roof clips)

UNDERWRITING RULES:
1. With Percentages: If explicit percentages are provided (e.g. "SINGLE PLY MEMBRANE (50%); SHINGLES, ASPHALT (47%); STEEL (3%)"), pick the covering material with the HIGHER percentage (Single-ply 7 wins with 50%).
2. Without Percentages: If multiple materials are listed without percentages, pick the WEAKER material according to cat modeling vulnerability.
3. Explicit Codes: If the input contains a code in parentheses like "(7)" or "Code 7", verify and assign that code.

WEAKNESS RANKING (higher = weaker):
Covering: Wood Shingles (2) > Asphalt Shingles (1) > Clay/Concrete Tiles (3) > Slate (5) > Smooth BUR/Mod-Bit (9) > Ballasted Single-Ply (10) > Single-Ply Membrane (7) > BUR with Gravel (6) > Light Metal Panels (4) > Photovoltaic (12) > Standing Seam (8) > Hurricane Wind-Rated (11)
Covering Attachment: Mortar (4) > Nails/staples (2) > Adhesive/epoxy (3) > Screws (1)
Deck Attachment: Nails generic (2) > 6d @ 6/12 (5) > 8d @ 6/12 (6) > 8d @ 6/6 (7) > Screws/bolts (1) > Adhesive/epoxy (3) > Structurally connected (4)
Geometry: Gable unbraced (2) > Gambrel (10) > Shed (6) > Flat (1) > Complex (4) > Stepped (5) > Mansard (7) > Gable braced (8) > Pyramid (9) > Hip (3)
Pitch: Low (1) > Medium (2) > High (3)
Deck: Light Metal (8) > OSB (3) > Wood Planks (2) > Plywood (1) > Metal Deck w/ Insulation (4) > Metal Deck w/ Concrete (5) > Pre-cast Concrete (6) > Reinforced Concrete (7)
Anchorage: Gravity/friction (4) > Nails/Screws (2) > Clips (7) > Hurricane Ties (1) > Anchor bolts (3) > Adhesive epoxy (5) > Structurally Connected (6)

OUTPUT FORMAT:
Output ONLY a JSON array of objects:
[{"lineNum": <int>, "geometryCode": "<0-10>", "pitchCode": "<0-3>", "coveringCode": "<0-12>", "deckCode": "<0-8>", "covAttachCode": "<0-4>", "deckAttachCode": "<0-7>", "anchorageCode": "<0-7>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(Number(item.lineNum), item);
        }
      });
    }

    const RoofTaxonomy = window.RoofTaxonomy || (window.RoofClassifier && window.RoofClassifier.taxonomy);
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          geometry: '—',
          geometryCode: '',
          geometryName: '',
          geometryShort: '',
          pitch: '—',
          pitchCode: '',
          pitchName: '',
          pitchShort: '',
          covering: '—',
          coveringCode: '',
          coveringName: '',
          coveringShort: '',
          deck: '—',
          deckCode: '',
          deckName: '',
          deckShort: '',
          covAttach: '—',
          covAttachCode: '',
          covAttachName: '',
          covAttachShort: '',
          coveringAttachment: '—',
          coveringAttachmentCode: '',
          deckAttach: '—',
          deckAttachCode: '',
          deckAttachName: '',
          deckAttachShort: '',
          deckAttachment: '—',
          deckAttachmentCode: '',
          anchorage: '—',
          anchorageCode: '',
          anchorageName: '',
          anchorageShort: '',
          recognizedCount: 0,
          status: 'empty',
          statusText: 'Blank',
          changed: false,
          aiEnhanced: false
        };
      }

      const local = window.RoofClassifier ? window.RoofClassifier.parseRoofRow(line, options) : {};
      const aiItem = aiMap.get(lineNum);

      let geomCode = local.geometryCode || '';
      let pitchCode = local.pitchCode || '';
      let covCode = local.coveringCode || '';
      let deckCode = local.deckCode || '';
      let covAttachCode = local.covAttachCode || '';
      let deckAttachCode = local.deckAttachCode || '';
      let anchorCode = local.anchorageCode || '';
      let aiEnhanced = false;

      if (aiItem) {
        if (aiItem.geometryCode !== undefined && aiItem.geometryCode !== null && aiItem.geometryCode !== '0') {
          geomCode = String(aiItem.geometryCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.pitchCode !== undefined && aiItem.pitchCode !== null && aiItem.pitchCode !== '0') {
          pitchCode = String(aiItem.pitchCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.coveringCode !== undefined && aiItem.coveringCode !== null && aiItem.coveringCode !== '0') {
          covCode = String(aiItem.coveringCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.deckCode !== undefined && aiItem.deckCode !== null && aiItem.deckCode !== '0') {
          deckCode = String(aiItem.deckCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.covAttachCode !== undefined && aiItem.covAttachCode !== null && aiItem.covAttachCode !== '0') {
          covAttachCode = String(aiItem.covAttachCode).trim();
          aiEnhanced = true;
        } else if (aiItem.coveringAttachmentCode !== undefined && aiItem.coveringAttachmentCode !== null && aiItem.coveringAttachmentCode !== '0') {
          covAttachCode = String(aiItem.coveringAttachmentCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.deckAttachCode !== undefined && aiItem.deckAttachCode !== null && aiItem.deckAttachCode !== '0') {
          deckAttachCode = String(aiItem.deckAttachCode).trim();
          aiEnhanced = true;
        } else if (aiItem.deckAttachmentCode !== undefined && aiItem.deckAttachmentCode !== null && aiItem.deckAttachmentCode !== '0') {
          deckAttachCode = String(aiItem.deckAttachmentCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.anchorageCode !== undefined && aiItem.anchorageCode !== null && aiItem.anchorageCode !== '0') {
          anchorCode = String(aiItem.anchorageCode).trim();
          aiEnhanced = true;
        }
      }

      const geomObj = RoofTaxonomy?.GEOMETRY?.[geomCode];
      const pitchObj = RoofTaxonomy?.PITCH?.[pitchCode];
      const covObj = RoofTaxonomy?.COVERING?.[covCode];
      const deckObj = RoofTaxonomy?.DECK?.[deckCode];
      const covAttachObj = RoofTaxonomy?.COVERING_ATTACHMENT?.[covAttachCode];
      const deckAttachObj = RoofTaxonomy?.DECK_ATTACHMENT?.[deckAttachCode];
      const anchorObj = RoofTaxonomy?.ANCHORAGE?.[anchorCode];

      let geomDisplay = geomCode;
      if (geomObj) {
        if (format === 'name_only') geomDisplay = geomObj.name;
        else if (format === 'name_code') geomDisplay = `${geomObj.name} (${geomObj.code})`;
        else if (format === 'short_code') geomDisplay = `${geomObj.shortName} (${geomObj.code})`;
      }

      let pitchDisplay = pitchCode;
      if (pitchObj) {
        if (format === 'name_only') pitchDisplay = pitchObj.name;
        else if (format === 'name_code') pitchDisplay = `${pitchObj.name} (${pitchObj.code})`;
        else if (format === 'short_code') pitchDisplay = `${pitchObj.shortName} (${pitchObj.code})`;
      }

      let covDisplay = covCode;
      if (covObj) {
        if (format === 'name_only') covDisplay = covObj.name;
        else if (format === 'name_code') covDisplay = `${covObj.name} (${covObj.code})`;
        else if (format === 'short_code') covDisplay = `${covObj.shortName} (${covObj.code})`;
      }

      let deckDisplay = deckCode;
      if (deckObj) {
        if (format === 'name_only') deckDisplay = deckObj.name;
        else if (format === 'name_code') deckDisplay = `${deckObj.name} (${deckObj.code})`;
        else if (format === 'short_code') deckDisplay = `${deckObj.shortName} (${deckObj.code})`;
      }

      let covAttachDisplay = covAttachCode;
      if (covAttachObj) {
        if (format === 'name_only') covAttachDisplay = covAttachObj.name;
        else if (format === 'name_code') covAttachDisplay = `${covAttachObj.name} (${covAttachObj.code})`;
        else if (format === 'short_code') covAttachDisplay = `${covAttachObj.shortName} (${covAttachObj.code})`;
      }

      let deckAttachDisplay = deckAttachCode;
      if (deckAttachObj) {
        if (format === 'name_only') deckAttachDisplay = deckAttachObj.name;
        else if (format === 'name_code') deckAttachDisplay = `${deckAttachObj.name} (${deckAttachObj.code})`;
        else if (format === 'short_code') deckAttachDisplay = `${deckAttachObj.shortName} (${deckAttachObj.code})`;
      }

      let anchorDisplay = anchorCode;
      if (anchorObj) {
        if (format === 'name_only') anchorDisplay = anchorObj.name;
        else if (format === 'name_code') anchorDisplay = `${anchorObj.name} (${anchorObj.code})`;
        else if (format === 'short_code') anchorDisplay = `${anchorObj.shortName} (${anchorObj.code})`;
      }

      const recCount = (geomCode ? 1 : 0) + (pitchCode ? 1 : 0) + (covCode ? 1 : 0) + (deckCode ? 1 : 0) + (covAttachCode ? 1 : 0) + (deckAttachCode ? 1 : 0) + (anchorCode ? 1 : 0);

      return {
        lineNum,
        original: line,
        cleaned: `${geomCode}\t${pitchCode}\t${covCode}\t${deckCode}\t${covAttachCode}\t${deckAttachCode}\t${anchorCode}`,
        geometry: geomDisplay,
        geometryCode: geomCode,
        geometryName: geomObj ? geomObj.name : '',
        geometryShort: geomObj ? geomObj.shortName : '',
        pitch: pitchDisplay,
        pitchCode: pitchCode,
        pitchName: pitchObj ? pitchObj.name : '',
        pitchShort: pitchObj ? pitchObj.shortName : '',
        covering: covDisplay,
        coveringCode: covCode,
        coveringName: covObj ? covObj.name : '',
        coveringShort: covObj ? covObj.shortName : '',
        deck: deckDisplay,
        deckCode: deckCode,
        deckName: deckObj ? deckObj.name : '',
        deckShort: deckObj ? deckObj.shortName : '',
        covAttach: covAttachDisplay,
        covAttachCode: covAttachCode,
        covAttachName: covAttachObj ? covAttachObj.name : '',
        covAttachShort: covAttachObj ? covAttachObj.shortName : '',
        coveringAttachment: covAttachDisplay,
        coveringAttachmentCode: covAttachCode,
        deckAttach: deckAttachDisplay,
        deckAttachCode: deckAttachCode,
        deckAttachName: deckAttachObj ? deckAttachObj.name : '',
        deckAttachShort: deckAttachObj ? deckAttachObj.shortName : '',
        deckAttachment: deckAttachDisplay,
        deckAttachmentCode: deckAttachCode,
        anchorage: anchorDisplay,
        anchorageCode: anchorCode,
        anchorageName: anchorObj ? anchorObj.name : '',
        anchorageShort: anchorObj ? anchorObj.shortName : '',
        recognizedCount: recCount,
        status: recCount === 7 ? 'match' : (recCount > 0 ? 'assigned' : 'empty'),
        statusText: recCount === 7 ? '✓ Complete (All 7 Fields Identified)' : (recCount > 0 ? `Separated (${recCount}/7 Fields)` : 'Blank'),
        changed: true,
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI roof classifications into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.recognizedCount > 0 && item.original) {
          learnItems.push({
            phrase: item.original,
            result: {
              geometryCode: item.geometryCode || '0',
              pitchCode: item.pitchCode || '0',
              coveringCode: item.coveringCode || '0',
              deckCode: item.deckCode || '0',
              covAttachCode: item.covAttachCode || '0',
              deckAttachCode: item.deckAttachCode || '0',
              anchorageCode: item.anchorageCode || '0'
            }
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('roof', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * AI-powered Foundation Type & Foundation Connection Classifier
   * Classifies into Touchstone Foundation Type (Codes 0-12) & Foundation Connection (Codes 0-3)
   */
  async classifyFoundationWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const format = options.format || 'code_only';
    const validLines = rawLines.map((line, idx) => ({ lineNum: idx + 1, text: String(line || '').trim() })).filter(v => v.text.length > 0);
    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        foundationType: '—',
        foundationTypeCode: '',
        foundationTypeName: '',
        foundationTypeShort: '',
        foundationConnection: '—',
        foundationConnectionCode: '',
        foundationConnectionName: '',
        foundationConnectionShort: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert structural engineering and catastrophe risk modeling analyst specialized in Verisk Touchstone UNICEDE® Foundation Detail Fields.
Your goal is to parse and classify each foundation description line into two Touchstone fields:
1. "foundationTypeCode": Foundation Type code (0 to 12)
2. "foundationConnectionCode": Foundation Connection code (0 to 3)

TOUCHSTONE UNICEDE FOUNDATION DETAIL SPECIFICATIONS:

Field 1: Foundation Type (Codes 0 to 12):
- 0: Unknown/default (unknown, default, unspecified)
- 1: Masonry basement (brick or CMU/block basement walls, masonry cellar)
- 2: Concrete basement (poured concrete, reinforced concrete RC basement, full concrete basement)
- 3: Masonry wall (masonry perimeter foundation wall; maps to 4 upon import in Touchstone)
- 4: Crawlspace cripple wall (wood) (wood cripple wall, pony wall, crawl space cripple wall; required for US Earthquake Model retrofit bracing)
- 5: Crawlspace masonry (wood) (masonry stem wall crawlspace supporting wood-framed floor)
- 6: Post & pier (timber posts, concrete piers, pier and beam, stilt/elevated foundation)
- 7: Footing (shallow spread footing, continuous strip footing, pad footing)
- 8: Mat / slab (mat foundation, slab-on-grade, raft foundation, monolithic concrete slab; standard for mid-rise buildings and commercial facilities)
- 9: Pile (deep pile foundation, driven steel/concrete piles, auger-cast piles, caissons, drilled shafts; standard for high-rise buildings and superior seismic performance)
- 10: No basement (structure built without basement / slab at grade; not applicable for US Earthquake Model)
- 11: Engineering foundation (custom engineered foundation, micropiles, rock anchors, specialized geotechnical systems)
- 12: Crawlspace - raised (wood) (elevated residential crawlspace with raised wood floor)

Field 2: Foundation Connection (Codes 0 to 3):
- 0: Unknown/default
- 1: Bolted / Anchor bolts (sill plate bolted to foundation with anchor bolts)
- 2: Straps / Hold-downs / Seismic ties (engineered hold-downs, steel straps, seismic ties)
- 3: Unanchored / Gravity / Friction / None (unanchored framing resting on foundation by gravity)

UNDERWRITING RULES:
- High-rise buildings (>8 stories) are predominantly supported on Pile foundations (Code 9).
- Mid-rise commercial buildings are typically built on Mat/slab foundations (Code 8).
- Single-family homes with basements are classified as Concrete basement (Code 2) or Masonry basement (Code 1).

OUTPUT FORMAT:
Output ONLY a valid JSON array of objects:
[
  {
    "lineNum": <int: 1-based original line index>,
    "foundationTypeCode": "<string: 0 to 12>",
    "foundationConnectionCode": "<string: 0 to 3>"
  }
]`;

    const userLinesText = validLines.map(v => `Line ${v.lineNum}: ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum !== undefined) {
          aiMap.set(item.lineNum, item);
        }
      });
    }

    const td = (typeof TouchstoneData !== 'undefined' ? TouchstoneData : null);
    const tax = (td && td.FOUNDATION) || ((typeof FoundationClassifier !== 'undefined') ? FoundationClassifier.TAXONOMY : null);

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          foundationType: '—',
          foundationTypeCode: '',
          foundationTypeName: '',
          foundationTypeShort: '',
          foundationConnection: '—',
          foundationConnectionCode: '',
          foundationConnectionName: '',
          foundationConnectionShort: '',
          recognizedCount: 0,
          status: 'empty',
          statusText: 'Blank',
          changed: false,
          aiEnhanced: false
        };
      }

      let typeCode = '';
      let connCode = '';
      let aiEnhanced = false;

      // Check deterministic cleaner baseline first
      if (typeof FoundationClassifier !== 'undefined' && FoundationClassifier.parseFoundationRow) {
        const det = FoundationClassifier.parseFoundationRow(line, { format: 'code_only' });
        if (det) {
          typeCode = det.foundationTypeCode || '';
          connCode = det.foundationConnectionCode || '';
        }
      }

      // Check AI predictions
      if (aiMap.has(lineNum)) {
        const aiItem = aiMap.get(lineNum);
        if (aiItem.foundationTypeCode !== undefined && aiItem.foundationTypeCode !== null && aiItem.foundationTypeCode !== '0') {
          typeCode = String(aiItem.foundationTypeCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.foundationConnectionCode !== undefined && aiItem.foundationConnectionCode !== null && aiItem.foundationConnectionCode !== '0') {
          connCode = String(aiItem.foundationConnectionCode).trim();
          aiEnhanced = true;
        }
      }

      const typeObj = (tax && tax.FOUNDATION_TYPE && tax.FOUNDATION_TYPE[typeCode]) || null;
      const connObj = (tax && tax.FOUNDATION_CONNECTION && tax.FOUNDATION_CONNECTION[connCode]) || null;

      let typeDisplay = typeCode || '—';
      if (typeObj) {
        if (format === 'name_only') typeDisplay = typeObj.name;
        else if (format === 'name_code') typeDisplay = `${typeObj.name} (${typeObj.code})`;
        else if (format === 'short_code') typeDisplay = `${typeObj.shortName} (${typeObj.code})`;
      }

      let connDisplay = connCode || '—';
      if (connObj) {
        if (format === 'name_only') connDisplay = connObj.name;
        else if (format === 'name_code') connDisplay = `${connObj.name} (${connObj.code})`;
        else if (format === 'short_code') connDisplay = `${connObj.shortName} (${connObj.code})`;
      }

      const recognizedCount = (typeCode ? 1 : 0) + (connCode ? 1 : 0);

      let status = 'assigned';
      let statusText = typeCode ? `✓ Identified (${typeObj ? typeObj.shortName : 'Code ' + typeCode})` : '⚠️ Unrecognized Foundation';
      if (recognizedCount === 2) {
        status = 'match';
        statusText = '✓ Complete (Type & Connection)';
      } else if (recognizedCount === 0) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Foundation Format';
      }

      const cleaned = connCode ? `${typeCode || '0'}\t${connCode}` : (typeCode || '');

      return {
        lineNum,
        original: line,
        cleaned,
        foundationType: typeDisplay,
        foundationTypeCode: typeCode,
        foundationTypeName: typeObj ? typeObj.name : '',
        foundationTypeShort: typeObj ? typeObj.shortName : '',
        foundationConnection: connDisplay,
        foundationConnectionCode: connCode,
        foundationConnectionName: connObj ? connObj.name : '',
        foundationConnectionShort: connObj ? connObj.shortName : '',
        recognizedCount,
        status,
        statusText,
        changed: true,
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI foundation classifications into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.recognizedCount > 0 && item.original) {
          learnItems.push({
            phrase: item.original,
            result: {
              foundationTypeCode: item.foundationTypeCode || '0',
              foundationConnectionCode: item.foundationConnectionCode || '0'
            }
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('foundation', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Parse Year Built records with Gemini 2.5 Flash
   * Enforces 1753 <= Year <= Current Year and selects older/lesser year for multi-year entries
   */
  async parseYearWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const minYear = typeof options.minYear === 'number' && !isNaN(options.minYear) ? options.minYear : 1753;
    const maxYear = typeof options.maxYear === 'number' && !isNaN(options.maxYear) ? options.maxYear : new Date().getFullYear();

    const validLines = rawLines.map((line, idx) => ({ lineNum: idx + 1, text: String(line || '').trim() })).filter(v => v.text.length > 0);
    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        year: '',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert insurance underwriting validator specializing in commercial and residential property Year Built fields.
Task: Extract and standardize the 4-digit Year Built for each record.

UNDERWRITING RULES:
1. Valid Range: Must be between ${minYear} and ${maxYear} inclusive. If a year is less than ${minYear} or greater than ${maxYear}, it is out-of-range and MUST be an empty string ("").
2. Multi-Year / Range Rule (CRITICAL): When multiple years or a range is present (e.g. "1995/2005", "2005/1995", "2005-1995", "Built 2005 / Ren 1995", "1995 & 2005", "2005/95"), ALWAYS select the LESSER / OLDER year (the original construction year, e.g. 1995).
3. If no valid year can be found, return empty string ("").

OUTPUT FORMAT:
Output ONLY a valid JSON array of objects:
[
  { "lineNum": <int: 1-based original line index>, "year": "<4-digit string or empty string>" }
]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum !== undefined) {
          aiMap.set(item.lineNum, String(item.year || '').trim());
        }
      });
    }

    const yearCleaner = (typeof window !== 'undefined' && window.YearBuiltCleaner)
      ? window.YearBuiltCleaner
      : (typeof YearBuiltCleaner !== 'undefined' ? YearBuiltCleaner : null);

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          year: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      let cleaned = '';
      let aiEnhanced = false;

      if (aiMap.has(lineNum)) {
        const candidate = aiMap.get(lineNum);
        const y = parseInt(candidate, 10);
        if (!isNaN(y) && y >= minYear && y <= maxYear) {
          cleaned = String(y);
          aiEnhanced = true;
        }
      }

      if (!cleaned && yearCleaner) {
        cleaned = yearCleaner.cleanYear(line, options);
      }

      let status = 'cleaned';
      let statusText = 'Cleaned';

      if (!trimmed) {
        status = 'empty';
        statusText = 'Blank';
      } else if (trimmed === cleaned) {
        status = 'unchanged';
        statusText = '✓ Valid Year';
      } else if (!cleaned) {
        status = 'mismatch';
        statusText = `⚠️ Out of Range (<${minYear} or >${maxYear})`;
      } else {
        const hasMultiple = /\b\d{4}\b.*\b\d{4}\b/.test(line) || /[/\\-]/.test(line);
        status = 'assigned';
        statusText = hasMultiple ? `✨ Older Year Selected (${cleaned})` : `✨ Standardized (${cleaned})`;
      }

      return {
        lineNum,
        original: line,
        cleaned,
        year: cleaned,
        changed: trimmed !== cleaned,
        status,
        statusText,
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI year extractions into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.cleaned && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.cleaned
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('year', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Underwriting validation for Roof Year Built against Year Built using AI
   * Enforces:
   * 1. Roof Year Built >= Year Built (never less, can equal)
   * 2. Without Year Built -> Blank
   * 3. Missing Roof Year -> Blank
   * 4. Multi-Year Roof (e.g. 2005/2006) -> Pick higher candidate year (2006) and ensure >= Year Built
   * 5. Valid range 1753 to current year (2026)
   */
  async classifyRoofYearWithAI(inputData, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    let ybLines = [];
    let ryLines = [];

    if (inputData && typeof inputData === 'object' && !Array.isArray(inputData)) {
      ybLines = Array.isArray(inputData.yearBuilt) ? inputData.yearBuilt : (inputData.yearBuilt || '').split(/\r\n|\r|\n/);
      ryLines = Array.isArray(inputData.roofYearBuilt) ? inputData.roofYearBuilt : (inputData.roofYearBuilt || '').split(/\r\n|\r|\n/);
    } else if (typeof inputData === 'string') {
      const rows = inputData.split(/\r\n|\r|\n/);
      rows.forEach(r => {
        const parts = r.split('\t');
        if (parts.length >= 2) {
          ybLines.push(parts[0]);
          ryLines.push(parts[1]);
        } else {
          ybLines.push(r);
          ryLines.push('');
        }
      });
    } else if (Array.isArray(inputData)) {
      inputData.forEach(r => {
        if (typeof r === 'string') {
          const parts = r.split('\t');
          ybLines.push(parts[0] || '');
          ryLines.push(parts[1] || '');
        } else if (r && typeof r === 'object') {
          ybLines.push(r.yearBuilt || r.yb || '');
          ryLines.push(r.roofYearBuilt || r.ry || '');
        }
      });
    }

    const totalRows = Math.max(ybLines.length, ryLines.length);
    if (totalRows === 0) return [];

    const minYear = typeof options.minYear === 'number' && !isNaN(options.minYear) ? options.minYear : 1753;
    const maxYear = typeof options.maxYear === 'number' && !isNaN(options.maxYear) ? options.maxYear : new Date().getFullYear();

    // Carry forward Year Built if row 1 had it
    let lastKnownYb = (ybLines.length >= 1 && ybLines[0] && ybLines[0].trim()) ? ybLines[0].trim() : '';

    const rowsWithData = [];
    for (let i = 0; i < totalRows; i++) {
      let yb = ybLines[i] !== undefined ? ybLines[i] : '';
      const ry = ryLines[i] !== undefined ? ryLines[i] : '';

      if (!yb.trim() && lastKnownYb && ry.trim()) {
        yb = lastKnownYb;
      } else if (yb.trim()) {
        lastKnownYb = yb.trim();
      }

      rowsWithData.push({
        lineNum: i + 1,
        yb: yb.trim(),
        ry: ry.trim()
      });
    }

    const nonBlankRows = rowsWithData.filter(r => r.yb || r.ry);
    let aiMap = new Map();

    if (nonBlankRows.length > 0) {
      const systemPrompt = `You are Neural Underwriting AI, an expert insurance underwriting validator for property Roof Year Built and Year Built.
Task: Validate and standardize the Roof Year Built against the Year Built for each row.

STRICT UNDERWRITING RULES:
1. Valid Range: Must be between ${minYear} and ${maxYear} inclusive.
2. Without Year Built: If Year Built is blank or missing, Roof Year MUST be an empty string ("").
3. Missing Roof Year: If Roof Year is blank or missing, cleaned Roof Year MUST be an empty string ("").
4. Roof Year >= Year Built Rule: Roof Year Built must be GREATER THAN OR EQUAL TO Year Built.
   - If Year Built = 2005 and Roof Year = 2006 -> Output: "2006" (Valid)
   - If Year Built = 2005 and Roof Year = 2005 -> Output: "2005" (Valid, Original Roof)
   - If Year Built = 2005 and Roof Year = 2004 or 2004/2003 -> Output: "" (Blank, Roof Year cannot be less than Year Built)
5. Multi-Year Roof Resolution: When Roof Year contains multiple years (e.g. "2005/2006", "2006/2007", "2004/2003"):
   - Filter candidate roof years that are >= Year Built and pick the HIGHER year. E.g. with YB 2005 and Roof 2005/2006 -> "2006".
   - If all candidate roof years are less than Year Built (e.g. 2004/2003 with YB 2005) -> Output: "".
6. Year Built Multi-Year Resolution: If Year Built contains multiple years (e.g. "1995/2005"), Year Built is the OLDER/LESSER year (1995).

OUTPUT FORMAT:
Output strictly a JSON array of objects:
[
  {
    "lineNum": <int: 1-based original line number>,
    "yearBuilt": "<4-digit parsed Year Built or empty string>",
    "cleaned": "<4-digit validated Roof Year Built or empty string>",
    "status": "<'unchanged' | 'assigned' | 'mismatch' | 'missing_yb' | 'missing_roof' | 'empty'>",
    "statusText": "<short explanatory underwriting status text>"
  }
]`;

      const userText = nonBlankRows.map(r => `Row ${r.lineNum}: Year Built = "${r.yb}", Roof Year = "${r.ry}"`).join('\n');
      try {
        const textOutput = await this.callGemini(systemPrompt, userText);
        const parsed = this._extractJSONArray(textOutput);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p && p.lineNum !== undefined) aiMap.set(p.lineNum, p);
          });
        }
      } catch (err) {
        console.warn('AI Roof Year call error, falling back to deterministic cleaner:', err);
      }
    }

    const roofYearCleaner = (typeof window !== 'undefined' && window.RoofYearCleaner) ? window.RoofYearCleaner : null;

    const results = [];
    lastKnownYb = (ybLines.length >= 1 && ybLines[0] && ybLines[0].trim()) ? ybLines[0].trim() : '';

    for (let idx = 0; idx < totalRows; idx++) {
      let yb = ybLines[idx] !== undefined ? ybLines[idx] : '';
      const ry = ryLines[idx] !== undefined ? ryLines[idx] : '';

      if (!yb.trim() && lastKnownYb && ry.trim()) {
        yb = lastKnownYb;
      } else if (yb.trim()) {
        lastKnownYb = yb.trim();
      }

      if (!yb.trim() && !ry.trim() && options.removeEmptyLines) {
        continue;
      }

      if (!yb.trim() && !ry.trim()) {
        results.push({
          lineNum: idx + 1,
          original: '',
          yearBuilt: '',
          rawYearBuilt: '',
          roofYearBuilt: '',
          rawRoofYearBuilt: '',
          cleaned: '',
          year: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        });
        continue;
      }

      const lineNum = idx + 1;
      const fallbackRes = roofYearCleaner ? roofYearCleaner.validateAndClean(yb, ry, options) : {
        yearBuilt: yb,
        roofYearBuilt: ry,
        cleaned: '',
        status: 'empty',
        statusText: 'Blank'
      };

      const aiRes = aiMap.get(lineNum);
      const yearBuilt = (aiRes && aiRes.yearBuilt) ? aiRes.yearBuilt : fallbackRes.yearBuilt;
      const cleaned = (aiRes && aiRes.cleaned !== undefined) ? aiRes.cleaned : fallbackRes.cleaned;
      const status = (aiRes && aiRes.status) ? aiRes.status : fallbackRes.status;
      const statusText = (aiRes && aiRes.statusText) ? aiRes.statusText : fallbackRes.statusText;

      results.push({
        lineNum,
        original: `${yb}\t${ry}`,
        yearBuilt: yearBuilt,
        rawYearBuilt: yb,
        roofYearBuilt: ry,
        rawRoofYearBuilt: ry,
        cleaned: cleaned,
        year: cleaned,
        changed: (ry.trim() !== cleaned) || (status === 'mismatch' || status === 'missing_yb'),
        status: status,
        statusText: statusText,
        aiEnhanced: aiMap.has(lineNum)
      });
    }

    return results;
  },

  /**
   * Normalize Number of Stores / Stories with AI
   * Enforces:
   * 1. Negative Values & Zero -> Blank (-5 -> Blank, -2 -> Blank, 0 -> Blank)
   * 2. Always Whole Number -> Round UP (3.5 -> 4, 4.2 -> 5, 1.1 -> 2, 0.5 -> 1)
   * 3. Ranges & Multi-values -> Pick Maximum (2 & 3 -> 3, 1,2 -> 2, 2/3 -> 3, 2-4 -> 4)
   * 4. "non", "none", "n/a", "-", blank -> Blank
   */
  async cleanStoresWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    const validLines = rawLines.map((line, idx) => ({ lineNum: idx + 1, text: String(line || '').trim() })).filter(v => v.text.length > 0);
    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        stores: '',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert insurance underwriting validator for building Number of Stories / Floors.
Task: Normalize building stories according to strict underwriting rules.

UNDERWRITING RULES:
1. Negative Values & Zero: If input has negative values (e.g. -5, -2, -1) or zero (0), output MUST be an empty string (""). Stories cannot be negative or zero in underwriting.
2. Always Whole Number (Round UP): Any decimal or fractional story MUST round UP to the next whole integer (e.g. 3.5 -> 4, 4.2 -> 5, 1.1 -> 2, 0.5 -> 1).
3. Multi-Value / Ranges: Always pick the MAXIMUM candidate story count (e.g. "2 & 3" -> 3, "1,2" -> 2, "2/3" -> 3, "2-4" -> 4, "1.5 & 2.2" -> 3, "2 and 3" -> 3, "1 to 3" -> 3).
4. Non-Applicable / Words: Inputs like "non", "none", "no", "n/a", "na", "null", "nil", "-", "unknown", "unk", "tbd" MUST be an empty string ("").
5. Empty / Whitespace -> Empty string ("").

OUTPUT FORMAT:
Output strictly a JSON array of objects:
[
  { "lineNum": <int: 1-based original line index>, "stores": "<integer string or empty string>" }
]`;

    const userText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    let aiMap = new Map();
    try {
      const responseText = await this.callGemini(systemPrompt, userText);
      const aiItems = this._extractJSONArray(responseText);
      if (Array.isArray(aiItems)) {
        aiItems.forEach(item => {
          if (item && item.lineNum !== undefined) {
            aiMap.set(item.lineNum, String(item.stores || '').trim());
          }
        });
      }
    } catch (err) {
      console.warn('AI stores call error, falling back to deterministic cleaner:', err);
    }

    const storesCleaner = (typeof window !== 'undefined' && window.NoOfStoresCleaner)
      ? window.NoOfStoresCleaner
      : (typeof NoOfStoresCleaner !== 'undefined' ? NoOfStoresCleaner : null);

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          stores: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      let cleaned = '';
      let aiEnhanced = false;

      if (aiMap.has(lineNum)) {
        const candidate = aiMap.get(lineNum);
        if (/^\d+$/.test(candidate) && parseInt(candidate, 10) > 0) {
          cleaned = candidate;
          aiEnhanced = true;
        }
      }

      if (!cleaned && storesCleaner) {
        cleaned = storesCleaner.cleanStores(line, options);
      }

      let status = 'cleaned';
      let statusText = 'Cleaned';

      if (!trimmed || /^(?:non|none|no|n\/?a|n\.a\.?|null|nil|not\s*applicable|unknown|unk|tbd|—+|-+|\.|\/|0|zero)$/i.test(trimmed)) {
        status = 'empty';
        statusText = 'Blank';
      } else if (trimmed === cleaned) {
        status = 'unchanged';
        statusText = '✓ Valid Stories';
      } else if (!cleaned) {
        status = 'mismatch';
        statusText = '⚠️ Negative or Invalid (→ Blank)';
      } else {
        const hasDec = /\.\d+/.test(line);
        const hasMulti = /[\/&,\-]|to|and/i.test(line);
        status = 'assigned';
        if (hasDec && hasMulti) {
          statusText = `✨ Max & Rounded UP (${cleaned})`;
        } else if (hasDec) {
          statusText = `✨ Rounded UP (${cleaned})`;
        } else if (hasMulti) {
          statusText = `✨ Max Candidate (${cleaned})`;
        } else {
          statusText = `✨ Standardized (${cleaned})`;
        }
      }

      return {
        lineNum,
        original: line,
        cleaned,
        stores: cleaned,
        changed: trimmed !== cleaned,
        status,
        statusText,
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI stores results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.cleaned && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.cleaned
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('stores', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Clean Full Name records with AI
   */
  async cleanNamesWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    const nonBlankLines = rawLines.map((line, idx) => ({ idx, line: String(line || '').trim() })).filter(item => item.line.length > 0);
    if (nonBlankLines.length === 0) {
      return rawLines.map((line, i) => ({
        lineNum: i + 1,
        original: line,
        cleaned: '',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI Name Standardizer.
Clean each person's full name:
1. Remove titles/honorifics (Mr., Mrs., Ms., Dr., Prof., Jr., Sr., Esq., II, III, IV).
2. Strip noise symbols and excess punctuation (,./<>?;':"|[]{}=+-_()#$%^&*@!).
3. Normalize spacing and standardize to clean Title Case (e.g. "JOHN D. SMITH, JR." -> "John D Smith").
Output ONLY a JSON array: [{"lineNum": <int: 1-based original line index>, "cleaned": "<Title Case cleaned name>"}]`;

    const userText = nonBlankLines.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
    let aiMap = new Map();
    try {
      const responseText = await this.callGemini(systemPrompt, userText);
      const parsedArray = this._extractJSONArray(responseText);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach(item => {
          if (item && item.lineNum !== undefined) aiMap.set(item.lineNum, String(item.cleaned || '').trim());
        });
      }
    } catch (err) {
      console.warn('AI name call error, falling back to deterministic cleaner:', err);
    }

    const fallbackCleaner = (typeof window !== 'undefined' && window.CleanersRegistry?.name?.cleaner) ? window.CleanersRegistry.name.cleaner : null;

    return rawLines.map((line, i) => {
      const lineNum = i + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const cleaned = aiMap.get(lineNum) || (fallbackCleaner ? fallbackCleaner.cleanAddress(line) : trimmed);
      return {
        lineNum,
        original: line,
        cleaned: cleaned,
        changed: trimmed !== cleaned,
        status: trimmed === cleaned ? 'unchanged' : 'assigned',
        statusText: trimmed === cleaned ? '✓ Valid' : `✨ Cleaned (${cleaned})`,
        aiEnhanced: aiMap.has(lineNum)
      };
    }).filter(Boolean);
  },

  /**
   * Clean Phone records with AI
   */
  async cleanPhonesWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    const nonBlankLines = rawLines.map((line, idx) => ({ idx, line: String(line || '').trim() })).filter(item => item.line.length > 0);
    if (nonBlankLines.length === 0) {
      return rawLines.map((line, i) => ({
        lineNum: i + 1,
        original: line,
        cleaned: '',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI Phone Number Standardizer.
Standardize phone numbers:
1. 10-digit US/Canada numbers format as "(XXX) XXX-XXXX".
2. 11-digit numbers starting with 1 format as "(XXX) XXX-XXXX".
3. Clean all formatting characters, extensions, or letters.
Output ONLY a JSON array: [{"lineNum": <int: 1-based original line index>, "cleaned": "<Standardized phone number>"}]`;

    const userText = nonBlankLines.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
    let aiMap = new Map();
    try {
      const responseText = await this.callGemini(systemPrompt, userText);
      const parsedArray = this._extractJSONArray(responseText);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach(item => {
          if (item && item.lineNum !== undefined) aiMap.set(item.lineNum, String(item.cleaned || '').trim());
        });
      }
    } catch (err) {
      console.warn('AI phone call error, falling back to deterministic cleaner:', err);
    }

    const fallbackCleaner = (typeof window !== 'undefined' && window.CleanersRegistry?.phone?.cleaner) ? window.CleanersRegistry.phone.cleaner : null;

    return rawLines.map((line, i) => {
      const lineNum = i + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const cleaned = aiMap.get(lineNum) || (fallbackCleaner ? fallbackCleaner.cleanAddress(line) : trimmed);
      return {
        lineNum,
        original: line,
        cleaned: cleaned,
        changed: trimmed !== cleaned,
        status: trimmed === cleaned ? 'unchanged' : 'assigned',
        statusText: trimmed === cleaned ? '✓ Valid' : `✨ Standardized (${cleaned})`,
        aiEnhanced: aiMap.has(lineNum)
      };
    }).filter(Boolean);
  },

  /**
   * Clean Email records with AI
   */
  async cleanEmailsWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    const nonBlankLines = rawLines.map((line, idx) => ({ idx, line: String(line || '').trim() })).filter(item => item.line.length > 0);
    if (nonBlankLines.length === 0) {
      return rawLines.map((line, i) => ({
        lineNum: i + 1,
        original: line,
        cleaned: '',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI Email Cleaner.
Clean email addresses:
1. Remove leading/trailing brackets, quotes, whitespace, or mailto: prefixes.
2. Standardize to lowercase.
3. Validate email syntax. If invalid or junk, clean or clear.
Output ONLY a JSON array: [{"lineNum": <int: 1-based original line index>, "cleaned": "<cleaned lowercase email>"}]`;

    const userText = nonBlankLines.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
    let aiMap = new Map();
    try {
      const responseText = await this.callGemini(systemPrompt, userText);
      const parsedArray = this._extractJSONArray(responseText);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach(item => {
          if (item && item.lineNum !== undefined) aiMap.set(item.lineNum, String(item.cleaned || '').trim());
        });
      }
    } catch (err) {
      console.warn('AI email call error, falling back to deterministic cleaner:', err);
    }

    const fallbackCleaner = (typeof window !== 'undefined' && window.CleanersRegistry?.email?.cleaner) ? window.CleanersRegistry.email.cleaner : null;

    return rawLines.map((line, i) => {
      const lineNum = i + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const cleaned = aiMap.get(lineNum) || (fallbackCleaner ? fallbackCleaner.cleanAddress(line) : trimmed);
      return {
        lineNum,
        original: line,
        cleaned: cleaned,
        changed: trimmed !== cleaned,
        status: trimmed === cleaned ? 'unchanged' : 'assigned',
        statusText: trimmed === cleaned ? '✓ Valid' : `✨ Cleaned (${cleaned})`,
        aiEnhanced: aiMap.has(lineNum)
      };
    }).filter(Boolean);
  },

  /**
   * Classify Foundation Connection descriptions with AI
   */
  async classifyFoundationConnectionWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    const nonBlankLines = rawLines
      .map((line, idx) => ({ line: String(line || '').trim(), idx }))
      .filter(item => item.line.length > 0);

    if (nonBlankLines.length === 0) {
      return rawLines.map((line, i) => ({
        lineNum: i + 1,
        original: line,
        cleaned: '',
        code: '',
        name: '',
        shortName: '',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert insurance catastrophe modeler and Verisk / Touchstone UNICEDE® exposure data specialist.

TASK: Classify raw property Foundation Connection descriptions into official Touchstone UNICEDE Foundation Connection Codes (0–6).

TOUCHSTONE UNICEDE® FOUNDATION CONNECTION TAXONOMY:
- 0: Unknown/default (0) -> Default / unknown / unspecified
- 1: Hurricane ties (1) -> Hurricane ties, seismic straps, uplift straps, hold-downs, foundation clips, Simpson strong-tie
- 2: Nails/Screws (2) -> Toe-nailing, framing nails, screws, wood screws, face nailed
- 3: Anchor Bolts (3) -> Anchor bolts, foundation bolts, sill plate bolts, bolted foundation, expansion bolts, J-bolts, bolting
- 4: Gravity/Friction (4) -> Gravity, friction, unanchored, dead load only, resting on foundation, no connection, unbolted. (For industrial facilities: Unanchored equipment)
- 5: Adhesive/Epoxy (5) -> Chemical adhesive anchors, structural epoxy bonding, resin anchors, glued to foundation
- 6: Structurally Connected (6) -> Monolithic concrete tie beam, welded connection, embed plates, continuous rebar, cast-in-place embed. (For industrial facilities: Anchored equipment)

SPECIAL INDUSTRIAL FACILITIES RULES:
- "Unanchored" / "Unanchored equipment" -> Code 4 (Gravity/Friction)
- "Anchored" / "Anchored equipment" -> Code 6 (Structurally Connected)

OUTPUT FORMAT:
Output strictly a JSON array of objects:
[
  {
    "lineNum": <int: 1-based original line index>,
    "code": "<0-6>",
    "shortName": "<Hurricane ties | Nails / Screws | Anchor Bolts | Gravity / Friction | Adhesive / Epoxy | Structurally Connected | Unknown / Default>",
    "reasoning": "<brief explanation>"
  }
]`;

    const userText = nonBlankLines.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
    let aiMap = new Map();
    try {
      const responseText = await this.callGemini(systemPrompt, userText);
      const parsedArray = this._extractJSONArray(responseText);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach(item => {
          if (item && item.lineNum !== undefined) {
            aiMap.set(item.lineNum, item);
          }
        });
      }
    } catch (err) {
      console.warn('AI foundation connection call error, falling back to deterministic cleaner:', err);
    }

    const fallbackClassifier = (typeof window !== 'undefined' && window.FoundationConnectionClassifier)
      ? window.FoundationConnectionClassifier
      : (typeof FoundationConnectionClassifier !== 'undefined' ? FoundationConnectionClassifier : null);

    const finalResults = rawLines.map((line, i) => {
      const lineNum = i + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          code: '',
          name: '',
          shortName: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const aiItem = aiMap.get(lineNum);
      let res = null;
      let aiEnhanced = false;

      if (aiItem && aiItem.code !== undefined) {
        const c = String(aiItem.code).trim();
        const taxItem = fallbackClassifier ? fallbackClassifier.TAXONOMY[c] : null;
        res = fallbackClassifier ? fallbackClassifier._formatResult(trimmed, c, taxItem, options) : { code: c, shortName: aiItem.shortName || '', cleaned: c };
        aiEnhanced = true;
      } else if (fallbackClassifier) {
        res = fallbackClassifier.classify(trimmed, options);
      } else {
        res = { original: line, code: '', cleaned: trimmed, status: 'assigned', statusText: 'Cleaned', changed: false };
      }

      return {
        lineNum,
        original: line,
        cleaned: res.cleaned,
        code: res.code,
        name: res.name || '',
        shortName: res.shortName || '',
        perils: res.perils || [],
        industrialEquiv: res.industrialEquiv || null,
        retrofitNote: res.retrofitNote || null,
        changed: trimmed !== res.cleaned,
        status: res.status || 'assigned',
        statusText: aiEnhanced ? `✨ AI (${res.shortName || 'Code ' + res.code})` : (res.statusText || '✓ Classified'),
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI foundation connection results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.code && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.code
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('foundation', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Use Gemini AI to classify Short Column conditions
   */
  async classifyShortColumnWithAI(rawLines, options = {}) {
    if (!rawLines || rawLines.length === 0) return [];
    const validLines = rawLines.map((l, idx) => ({ lineNum: idx + 1, text: String(l || '').trim() })).filter(x => x.text.length > 0);
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        code: '',
        shortColumnCode: '',
        shortColumn: '—',
        shortColumnName: '',
        shortColumnShort: '',
        perils: 'CA EQ, HI EQ, JP EQ, US EQ',
        requirement: 'Optional',
        status: 'empty',
        statusText: 'Blank',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert structural engineering and property catastrophe modeling underwriting assistant specialized in Verisk Touchstone UNICEDE® Short Column classification.
Your goal is to parse and classify each short column input line into the Touchstone UNICEDE Short Column code (0, 1, or 2).

TOUCHSTONE UNICEDE SHORT COLUMN SPECIFICATION:
- Perils: CA EQ, HI EQ, JP EQ, US EQ
- Requirement: Optional
- Codes:
  - 0: Unknown/default (0)
  - 1: No (1) - No short columns present
  - 2: Yes (2) - Short columns present

TECHNICAL UNDERWRITING DETAILS:
This field applies to old concrete structures in which the fill height of some column has been restricted by spandrel beams or infill walls.
If some of the columns along the perimeter are shorter than the adjacent columns, there is high chance that the shorter columns can no longer bear the loads for which they were originally designed.

OUTPUT FORMAT:
Output ONLY a JSON array of objects:
[{"lineNum": <int>, "code": "<0|1|2>", "name": "<Unknown/default|No|Yes>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(item.lineNum, item);
        }
      });
    }

    const fallbackClassifier = window.ShortColumnClassifier;
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          code: '',
          shortColumnCode: '',
          shortColumn: '—',
          shortColumnName: '',
          shortColumnShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, US EQ',
          requirement: 'Optional',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const aiItem = aiMap.get(lineNum);
      let code = '';
      let name = '';
      let shortName = '';
      let aiEnhanced = false;

      if (aiItem && aiItem.code !== undefined) {
        code = String(aiItem.code).trim();
        name = aiItem.name || (code === '2' ? 'Yes' : (code === '1' ? 'No' : 'Unknown/default'));
        shortName = name;
        aiEnhanced = true;
      } else if (fallbackClassifier) {
        const match = fallbackClassifier.classifyShortColumn(trimmed, options);
        code = match ? match.code : '';
        name = match ? match.name : '';
        shortName = match ? match.shortName : '';
      }

      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = code ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = code ? `${shortName} (${code})` : trimmed;

      return {
        lineNum,
        original: line,
        cleaned: code,
        code,
        shortColumnCode: code,
        shortColumn: display,
        shortColumnName: name,
        shortColumnShort: shortName,
        perils: 'CA EQ, HI EQ, JP EQ, US EQ',
        requirement: 'Optional',
        changed: trimmed !== code,
        status: code ? 'assigned' : 'mismatch',
        statusText: aiEnhanced ? `✨ AI (${name} - Code ${code})` : (code ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized'),
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.code && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.code
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('short_column', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Use Gemini AI to classify Building Exterior Opening descriptions
   */
  async classifyBuildingExteriorOpeningWithAI(rawLines, options = {}) {
    if (!rawLines || rawLines.length === 0) return [];
    const validLines = rawLines.map((l, idx) => ({ lineNum: idx + 1, text: String(l || '').trim() })).filter(x => x.text.length > 0);
    if (!this.isConfigured()) throw new Error('Please configure an AI API key in AI Settings.');

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        code: '',
        buildingExteriorOpeningCode: '',
        buildingExteriorOpening: '—',
        buildingExteriorOpeningName: '',
        buildingExteriorOpeningShort: '',
        perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: 'Optional',
        status: 'empty',
        statusText: 'Blank',
        changed: false,
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are Neural Underwriting AI, an expert structural engineering and property catastrophe modeling underwriting assistant specialized in Verisk Touchstone UNICEDE® Building Exterior Opening classification.
Your goal is to parse and classify each raw exterior wall opening description into the Touchstone UNICEDE Building Exterior Opening code (0, 1, or 2).

TOUCHSTONE UNICEDE BUILDING EXTERIOR OPENING SPECIFICATION:
- Perils: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ
- Requirement: Optional
- Description: Percentage of exterior walls that are open (windows or doors).
- Codes:
  - 0: Unknown (0) -> Unknown or default percentage of exterior wall open.
  - 1: Less than 50% of wall open / default (1) -> Standard windows, minimal openings, <50% open, punched windows.
  - 2: More than 50% of wall open (2) -> >50% open, storefront glass, curtain walls, extensive glazing.

TECHNICAL UNDERWRITING DETAILS:
A shear wall with many openings for windows and doors has less resistance to earthquake loads. Buildings with walls that are more than 50% open are evaluated as having less seismic resistance than they would otherwise.

OUTPUT FORMAT:
Output ONLY a JSON array of objects:
[{"lineNum": <int>, "code": "<0|1|2>", "name": "<Unknown|Less than 50% of wall open / default|More than 50% of wall open>", "shortName": "<Unknown (0)|Less than 50% open (1)|More than 50% open (2)>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    let aiMap = new Map();
    try {
      const responseText = await this.callGemini(systemPrompt, userLinesText);
      const aiItems = this._extractJSONArray(responseText);
      if (Array.isArray(aiItems)) {
        aiItems.forEach(item => {
          if (item && item.lineNum) {
            aiMap.set(item.lineNum, item);
          }
        });
      }
    } catch (err) {
      console.warn('AI Building Exterior Opening error, falling back:', err);
    }

    const fallbackClassifier = window.BuildingExteriorOpeningClassifier;
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          code: '',
          buildingExteriorOpeningCode: '',
          buildingExteriorOpening: '—',
          buildingExteriorOpeningName: '',
          buildingExteriorOpeningShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
          requirement: 'Optional',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const aiItem = aiMap.get(lineNum);
      let code = '';
      let name = '';
      let shortName = '';
      let aiEnhanced = false;

      if (aiItem && aiItem.code !== undefined) {
        code = String(aiItem.code).trim();
        name = aiItem.name || (code === '2' ? 'More than 50% of wall open' : (code === '1' ? 'Less than 50% of wall open / default' : 'Unknown'));
        shortName = aiItem.shortName || (code === '2' ? 'More than 50% open (2)' : (code === '1' ? 'Less than 50% open (1)' : 'Unknown (0)'));
        aiEnhanced = true;
      } else if (fallbackClassifier) {
        const match = fallbackClassifier.classifyBuildingExteriorOpening(trimmed, options);
        code = match ? match.code : '';
        name = match ? match.name : '';
        shortName = match ? match.shortName : '';
      }

      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = code ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = code ? `${shortName}` : trimmed;

      return {
        lineNum,
        original: line,
        cleaned: code,
        code,
        buildingExteriorOpeningCode: code,
        buildingExteriorOpening: display,
        buildingExteriorOpeningName: name,
        buildingExteriorOpeningShort: shortName,
        perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: 'Optional',
        changed: trimmed !== code,
        status: code ? 'assigned' : 'mismatch',
        statusText: aiEnhanced ? `✨ AI (${shortName || name})` : (code ? `✓ Cleaned (${shortName || name})` : '⚠️ Unrecognized'),
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.code && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.code
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('building_exterior_opening', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  /**
   * Clean and classify Soft Story values using Gemini AI
   */
  async cleanSoftStoryWithAI(rawLines, options = {}) {
    const validLines = rawLines
      .map((line, idx) => ({ lineNum: idx + 1, text: (line || '').trim() }))
      .filter(item => item.text.length > 0);

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        code: '',
        softStoryCode: '',
        softStory: '—',
        softStoryName: '',
        softStoryShort: '',
        perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: 'Optional',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are a catastrophe risk modeling and structural engineering expert specializing in Touchstone UNICEDE® exposure data and earthquake vulnerability classification.
Classify each soft story input into the official Touchstone UNICEDE® Soft Story taxonomy (Codes 0–2):

Taxonomy:
- Code 0: "Unknown/default" (Unknown, default, unspecified, unk, tbd, 0)
- Code 1: "No" (No soft story, without soft story, false, stiff, regular, adequate lateral stiffness, 1)
- Code 2: "Yes" (Structural weakness at any floor, first-floor garage, tuck-under parking, open front, taller first floor, lateral weakness, pancaking vulnerability, weak floor, 2)

Engineering & Underwriting Rules:
- Applicable Models: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional, Defaults to 0).
- Applicable only if the number of stories is 2 or greater.
- First-floor garages and taller first floors are prone to soft-story behavior.
- In residential buildings, soft story is most often found in the first floor due to large openings/garages.

Output ONLY a JSON array of objects:
[{"lineNum": <int>, "code": "<0|1|2>", "name": "<Unknown/default|No|Yes>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(item.lineNum, item);
        }
      });
    }

    const fallbackClassifier = window.SoftStoryClassifier;
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          code: '',
          softStoryCode: '',
          softStory: '—',
          softStoryName: '',
          softStoryShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
          requirement: 'Optional',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const aiItem = aiMap.get(lineNum);
      let code = '';
      let name = '';
      let shortName = '';
      let aiEnhanced = false;

      if (aiItem && aiItem.code !== undefined) {
        code = String(aiItem.code).trim();
        name = aiItem.name || (code === '2' ? 'Yes' : (code === '1' ? 'No' : 'Unknown/default'));
        shortName = name;
        aiEnhanced = true;
      } else if (fallbackClassifier) {
        const match = fallbackClassifier.classifySoftStory(trimmed, options);
        code = match ? match.code : '';
        name = match ? match.name : '';
        shortName = match ? match.shortName : '';
      }

      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = code ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = code ? `${shortName} (${code})` : trimmed;

      return {
        lineNum,
        original: line,
        cleaned: code,
        code,
        softStoryCode: code,
        softStory: display,
        softStoryName: name,
        softStoryShort: shortName,
        perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: 'Optional',
        changed: trimmed !== code,
        status: code ? 'assigned' : 'mismatch',
        statusText: aiEnhanced ? `✨ AI (${name} - Code ${code})` : (code ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized'),
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.code && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.code
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('soft_story', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  classifySoftStoryWithAI(rawLines, options = {}) {
    return this.cleanSoftStoryWithAI(rawLines, options);
  },

  /**
   * Clean and classify Building Shape values using Gemini AI
   */
  async cleanBuildingShapeWithAI(rawLines, options = {}) {
    const validLines = rawLines
      .map((line, idx) => ({ lineNum: idx + 1, text: (line || '').trim() }))
      .filter(item => item.text.length > 0);

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        code: '',
        buildingShapeCode: '',
        buildingShape: '—',
        buildingShapeName: '',
        buildingShapeShort: '',
        perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: 'Optional',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are a catastrophe risk modeling and structural engineering expert specializing in Touchstone UNICEDE® exposure data and building footprint geometry classification.
Classify each building shape input into the official Touchstone UNICEDE® Building Shape taxonomy (Codes 0–8):

Taxonomy:
- Code 0: "Unknown/default" (Unknown, default, unspecified, unk, tbd, 0)
- Code 1: "Square" (Square footprint, regular square, quadrilateral, box, 1)
- Code 2: "Rectangle" (Rectangular footprint, oblong, standard box, 2)
- Code 3: "Circular" (Circular, circle, round, curved, cylinder, cylindrical, oval, elliptical, rotunda, 3)
- Code 4: "L-shaped" (L-shaped, L shape, ell shaped, re-entrant corner L, 4)
- Code 5: "T-shaped" (T-shaped, T shape, tee shaped, 5)
- Code 6: "U-shaped" (U-shaped, U shape, horseshoe, courtyard, C-shaped, 6)
- Code 7: "H-shaped" (H-shaped, H shape, central connector wing, 7)
- Code 8: "Complex" (Complex, irregular, multi-wing, cruciform, cross-shaped, Y-shaped, Z-shaped, polygonal, asymmetrical, angular, star-shaped, 8)

Engineering & Underwriting Rules:
- Applicable Models: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional, Defaults to 0).
- Shape is critical for the performance of a structure, especially for large commercial buildings.
- In general, simple regular forms, like squares and rectangles, perform better than combinations of those, such as L- and T-shaped buildings. The sharp corners in these complex shapes are vulnerable.

Output ONLY a JSON array of objects:
[{"lineNum": <int>, "code": "<0|1|2|3|4|5|6|7|8>", "name": "<Unknown/default|Square|Rectangle|Circular|L-shaped|T-shaped|U-shaped|H-shaped|Complex>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(item.lineNum, item);
        }
      });
    }

    const fallbackClassifier = window.BuildingShapeClassifier;
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          code: '',
          buildingShapeCode: '',
          buildingShape: '—',
          buildingShapeName: '',
          buildingShapeShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
          requirement: 'Optional',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const aiItem = aiMap.get(lineNum);
      let code = '';
      let name = '';
      let shortName = '';
      let aiEnhanced = false;

      if (aiItem && aiItem.code !== undefined) {
        code = String(aiItem.code).trim();
        name = aiItem.name || (
          code === '1' ? 'Square' :
          code === '2' ? 'Rectangle' :
          code === '3' ? 'Circular' :
          code === '4' ? 'L-shaped' :
          code === '5' ? 'T-shaped' :
          code === '6' ? 'U-shaped' :
          code === '7' ? 'H-shaped' :
          code === '8' ? 'Complex' : 'Unknown/default'
        );
        shortName = `${name} (${code})`;
        aiEnhanced = true;
      } else if (fallbackClassifier) {
        const match = fallbackClassifier.classifyBuildingShape(trimmed, options);
        code = match ? match.code : '';
        name = match ? match.name : '';
        shortName = match ? match.shortName : '';
      }

      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = code ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = code ? `${shortName}` : trimmed;

      return {
        lineNum,
        original: line,
        cleaned: code,
        code,
        buildingShapeCode: code,
        buildingShape: display,
        buildingShapeName: name,
        buildingShapeShort: shortName,
        perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: 'Optional',
        changed: trimmed !== code,
        status: code ? 'assigned' : 'mismatch',
        statusText: aiEnhanced ? `✨ AI (${name} - Code ${code})` : (code ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized'),
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.code && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.code
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('building_shape', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  classifyBuildingShapeWithAI(rawLines, options = {}) {
    return this.cleanBuildingShapeWithAI(rawLines, options);
  },

  /**
   * Clean and classify Ornamentation values using Gemini AI
   */
  async cleanOrnamentationWithAI(rawLines, options = {}) {
    const validLines = rawLines
      .map((line, idx) => ({ lineNum: idx + 1, text: (line || '').trim() }))
      .filter(item => item.text.length > 0);

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        code: '',
        ornamentationCode: '',
        ornamentation: '—',
        ornamentationName: '',
        ornamentationShort: '',
        perils: 'CA EQ, HI EQ, JP EQ, US EQ',
        requirement: 'Optional',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are a catastrophe risk modeling and structural engineering expert specializing in Touchstone UNICEDE® exposure data and building facade / exterior ornamentation classification.
Classify each building ornamentation input into the official Touchstone UNICEDE® Ornamentation taxonomy (Codes 0–3):

Taxonomy:
- Code 0: "Unknown/default" (Unknown, default, unspecified, unk, tbd, 0)
- Code 1: "None" (No ornamentation, no decorative elements, unornamented, plain, absent, without ornamentation, 1)
- Code 2: "Average" (Average, moderate, standard decorative trim, typical, medium ornamentation, 2)
- Code 3: "Extensive" (Extensive, heavy, complex, unreinforced parapet walls, unbraced parapet, entryway roofs, highly decorative facade, cornices, gargoyles, 3)

Engineering & Underwriting Rules:
- Applicable Models: CA EQ, HI EQ, JP EQ, US EQ (Optional, Defaults to 0).
- Decorative elements may fall during an earthquake. Examples include unreinforced or unbraced parapet walls or entryway roofs, which can break off during excessive shaking.

Output ONLY a JSON array of objects:
[{"lineNum": <int>, "code": "<0|1|2|3>", "name": "<Unknown/default|None|Average|Extensive>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(item.lineNum, item);
        }
      });
    }

    const fallbackClassifier = window.OrnamentationClassifier;
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          code: '',
          ornamentationCode: '',
          ornamentation: '—',
          ornamentationName: '',
          ornamentationShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, US EQ',
          requirement: 'Optional',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const aiItem = aiMap.get(lineNum);
      let code = '';
      let name = '';
      let shortName = '';
      let aiEnhanced = false;

      if (aiItem && aiItem.code !== undefined) {
        code = String(aiItem.code).trim();
        name = aiItem.name || (
          code === '1' ? 'None' :
          code === '2' ? 'Average' :
          code === '3' ? 'Extensive' : 'Unknown/default'
        );
        shortName = `${name} (${code})`;
        aiEnhanced = true;
      } else if (fallbackClassifier) {
        const match = fallbackClassifier.classifyOrnamentation(trimmed, options);
        code = match ? match.code : '';
        name = match ? match.name : '';
        shortName = match ? match.shortName : '';
      }

      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = code ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = code ? `${shortName}` : trimmed;

      return {
        lineNum,
        original: line,
        cleaned: code,
        code,
        ornamentationCode: code,
        ornamentation: display,
        ornamentationName: name,
        ornamentationShort: shortName,
        perils: 'CA EQ, HI EQ, JP EQ, US EQ',
        requirement: 'Optional',
        changed: trimmed !== code,
        status: code ? 'assigned' : 'mismatch',
        statusText: aiEnhanced ? `✨ AI (${name} - Code ${code})` : (code ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized'),
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.code && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.code
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('ornamentation', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  classifyOrnamentationWithAI(rawLines, options = {}) {
    return this.cleanOrnamentationWithAI(rawLines, options);
  },

  classifyFoundationTypeWithAI(rawLines, options = {}) {
    return this.classifyFoundationWithAI(rawLines, options);
  },

  cleanFoundationTypeWithAI(rawLines, options = {}) {
    return this.classifyFoundationWithAI(rawLines, options);
  },

  /**
   * Clean and classify Building Condition values using Gemini AI
   */
  async cleanBuildingConditionWithAI(rawLines, options = {}) {
    const validLines = rawLines
      .map((line, idx) => ({ lineNum: idx + 1, text: (line || '').trim() }))
      .filter(item => item.text.length > 0);

    if (validLines.length === 0) {
      return rawLines.map((line, idx) => ({
        lineNum: idx + 1,
        original: line,
        cleaned: '',
        code: '',
        buildingConditionCode: '',
        buildingCondition: '—',
        buildingConditionName: '',
        buildingConditionShort: '',
        perils: 'CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST',
        requirement: 'Optional',
        changed: false,
        status: 'empty',
        statusText: 'Blank',
        aiEnhanced: false
      }));
    }

    const systemPrompt = `You are a catastrophe risk modeling and structural engineering expert specializing in Touchstone UNICEDE® exposure data and building cladding & maintenance condition classification.
Classify each building condition input into the official Touchstone UNICEDE® Building Condition taxonomy (Codes 0–3):

Taxonomy:
- Code 0: "Unknown" (Unknown or default building maintenance and cladding condition, unspecified, unk, tbd, 0)
- Code 1: "Average" (Standard maintenance, typical minor wear, normal aging, moderate wear, no severe distress. Default for earthquake models)
- Code 2: "Good" (Well-maintained, recent renovation, sound cladding, intact roof/chimney, superior upkeep, excellent, pristine)
- Code 3: "Poor" (Signs of distress or duress: cracking due to aging/settlement/overload, loose roof tiles, damaged cladding/chimneys, deferred maintenance, previous storm/quake damage, dilapidated)

Engineering & Underwriting Rules:
- Applicable Models: CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST (Straight-Line Winds, Tornadoes).
- Status: Optional. Defaults to 0 (Unknown), though default is Average (1) for earthquake models.
- Earthquakes: Buildings with signs of distress or duress (cracking from aging/settlement/overload or damage from previous earthquakes) suffer severe additional damage.
- Hurricanes & Storms: Buildings with signs of distress or duress (aging roof/cladding, loose tiles, chimney damage, previous storm damage) experience severe additional damage during tropical cyclones.

Output ONLY a JSON array of objects:
[{"lineNum": <int>, "code": "<0|1|2|3>", "name": "<Unknown|Average|Good|Poor>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSONArray(responseText);

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(item.lineNum, item);
        }
      });
    }

    const fallbackClassifier = window.BuildingConditionClassifier;
    const format = options.format || 'code_only';

    const finalResults = rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      if (!trimmed) {
        return {
          lineNum,
          original: line,
          cleaned: '',
          code: '',
          buildingConditionCode: '',
          buildingCondition: '—',
          buildingConditionName: '',
          buildingConditionShort: '',
          perils: 'CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST',
          requirement: 'Optional',
          changed: false,
          status: 'empty',
          statusText: 'Blank',
          aiEnhanced: false
        };
      }

      const aiItem = aiMap.get(lineNum);
      let code = '';
      let name = '';
      let shortName = '';
      let aiEnhanced = false;

      if (aiItem && aiItem.code !== undefined) {
        code = String(aiItem.code).trim();
        name = aiItem.name || (
          code === '1' ? 'Average' :
          code === '2' ? 'Good' :
          code === '3' ? 'Poor' : 'Unknown'
        );
        shortName = `${name} (${code})`;
        aiEnhanced = true;
      } else if (fallbackClassifier) {
        const match = fallbackClassifier.classifyBuildingCondition(trimmed, options);
        code = match ? match.code : '';
        name = match ? match.name : '';
        shortName = match ? match.shortName : '';
      }

      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = code ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = code ? `${shortName}` : trimmed;

      return {
        lineNum,
        original: line,
        cleaned: code,
        code,
        buildingConditionCode: code,
        buildingCondition: display,
        buildingConditionName: name,
        buildingConditionShort: shortName,
        perils: 'CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST',
        requirement: 'Optional',
        changed: trimmed !== code,
        status: code ? 'assigned' : 'mismatch',
        statusText: aiEnhanced ? `✨ AI (${name} - Code ${code})` : (code ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized'),
        aiEnhanced
      };
    }).filter(Boolean);

    // Continuous Self-Training: Auto-learn AI results into persistent memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.learnBatch) {
      const learnItems = [];
      finalResults.forEach(item => {
        if (item.aiEnhanced && item.code && item.original) {
          learnItems.push({
            phrase: item.original,
            result: item.code
          });
        }
      });
      if (learnItems.length > 0) {
        CustomCodesDB.learnBatch('building_condition', learnItems, 'ai');
      }
    }

    return finalResults;
  },

  classifyBuildingConditionWithAI(rawLines, options = {}) {
    return this.cleanBuildingConditionWithAI(rawLines, options);
  }
};

if (typeof window !== 'undefined') {
  window.GeminiService = GeminiService;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiService;
}


