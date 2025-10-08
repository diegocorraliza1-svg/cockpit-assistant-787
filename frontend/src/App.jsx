import React, { useState, useMemo } from 'react';
import { Send, Upload, FileText, LogOut, User, Shield, AlertCircle, CheckCircle, Clock, X, Trash2, Eye, Search, Filter, Download, BarChart3, Users, Settings, Bell, Star, Moon, Sun, Menu, History, Share2, Archive, TrendingUp, MessageSquare, Calendar, Activity } from 'lucide-react';

export default function CockpitAssistant787() {
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [deletedDocs, setDeletedDocs] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAircraft, setFilterAircraft] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [darkMode, setDarkMode] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [users, setUsers] = useState([
    { id: 1, name: 'Carlos Rodríguez', role: 'Capitán', license: 'ATPL-12345', email: 'carlos@airline.com', active: true, lastLogin: '2025-10-07', queries: 142 },
    { id: 2, name: 'Ana Martínez', role: 'Primer Oficial', license: 'ATPL-67890', email: 'ana@airline.com', active: true, lastLogin: '2025-10-06', queries: 89 },
    { id: 3, name: 'Miguel Sánchez', role: 'Instructor', license: 'ATPL-11111', email: 'miguel@airline.com', active: true, lastLogin: '2025-10-05', queries: 234 }
  ]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'document', message: 'Nuevo documento: B787 FCOM v2.4 subido', time: '2 horas', read: false },
    { id: 2, type: 'system', message: 'Actualización del sistema completada', time: '1 día', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [queryStats, setQueryStats] = useState({
    today: 247,
    week: 1834,
    month: 7234,
    topQueries: [
      { query: 'Procedimiento de falla de motor', count: 145 },
      { query: 'Limitaciones de peso', count: 128 },
      { query: 'Sistema hidráulico', count: 98 },
      { query: 'Procedimiento de despegue', count: 87 },
      { query: 'Emergency descent', count: 76 }
    ],
    topDocs: [
      { doc: 'B787 QRH', queries: 456 },
      { doc: 'B787 FCOM Vol 1', queries: 389 },
      { doc: 'SOP Standard', queries: 234 }
    ]
  });
  const [quickActions] = useState([
    { label: 'Falla de Motor', query: '¿Cuál es el procedimiento de falla de motor en despegue?' },
    { label: 'Limitaciones', query: '¿Cuáles son las limitaciones de peso para el B787?' },
    { label: 'Sistema Hidráulico', query: 'Explícame el sistema hidráulico del B787' },
    { label: 'Emergency Descent', query: 'Procedimiento de descenso de emergencia' }
  ]);

  const handleLogin = (role, userName = 'Usuario Demo') => {
    setUserRole(role);
    setCurrentUser({ name: userName, role: role === 'pilot' ? 'Capitán' : 'Administrador' });
    if (role === 'pilot') {
      const newConv = {
        id: Date.now(),
        title: 'Nueva Conversación',
        messages: [{
          type: 'system',
          content: 'Bienvenido a Cockpit Assistant 787. Puedo ayudarte con consultas sobre tu documentación de vuelo. ¿En qué puedo asistirte?',
          timestamp: new Date()
        }],
        timestamp: new Date()
      };
      setMessages(newConv.messages);
      setCurrentConversation(newConv);
      setConversationHistory([newConv]);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMsg = { type: 'user', content: inputMessage, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    
    setTimeout(() => {
      const aiResponse = {
        type: 'assistant',
        content: `He encontrado información sobre "${inputMessage}".\n\n**Respuesta simulada**\nEn producción, aquí aparecerá la respuesta de GPT-5 basada en tus manuales con análisis multimodal de diagramas y tablas.\n\n**Fuentes consultadas:**\n• ${documents[0]?.name || 'Documento ejemplo'}, Página 127, Sección 3.2\n• Diagrama: Sistema hidráulico principal\n• Tabla: Limitaciones operacionales`,
        sources: documents.length > 0 ? [{ doc: documents[0].name, page: 127, section: '3.2' }] : [],
        confidence: 0.92,
        timestamp: new Date()
      };
      const updatedMessages = [...newMessages, aiResponse];
      setMessages(updatedMessages);
      
      if (currentConversation) {
        const updatedConv = { ...currentConversation, messages: updatedMessages, title: inputMessage.slice(0, 50) };
        setCurrentConversation(updatedConv);
        setConversationHistory(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
      }
    }, 1000);
    setInputMessage('');
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files.map(file => ({
      file, name: file.name, size: file.size, type: 'Manual', aircraftType: 'B787', version: '1.0', notes: ''
    })));
    setShowUploadModal(true);
  };

  const updateFileMetadata = (index, field, value) => {
    setSelectedFiles(prev => prev.map((file, i) => i === index ? { ...file, [field]: value } : file));
  };

  const confirmUpload = () => {
    selectedFiles.forEach(fileData => {
      const newFile = {
        id: Date.now() + Math.random(),
        name: fileData.name,
        progress: 0,
        type: fileData.type,
        aircraftType: fileData.aircraftType,
        version: fileData.version,
        notes: fileData.notes
      };
      setUploadingFiles(prev => [...prev, newFile]);
      
      setNotifications(prev => [{
        id: Date.now(),
        type: 'document',
        message: `Nuevo documento: ${fileData.name} está siendo procesado`,
        time: 'Ahora',
        read: false
      }, ...prev]);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setUploadingFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, progress } : f));
        } else {
          clearInterval(interval);
          setUploadingFiles(prev => prev.filter(f => f.id !== newFile.id));
          setDocuments(prev => [...prev, {
            ...newFile,
            pages: Math.floor(Math.random() * 300) + 50,
            status: 'ready',
            uploadDate: new Date().toISOString().split('T')[0],
            queries: 0
          }]);
          
          setNotifications(prev => [{
            id: Date.now() + 1,
            type: 'document',
            message: `${fileData.name} listo para consultas`,
            time: 'Ahora',
            read: false
          }, ...prev]);
        }
      }, 300);
    });
    setShowUploadModal(false);
    setSelectedFiles([]);
  };

  const deleteDocument = (docId) => {
    const doc = documents.find(d => d.id === docId);
    setDeletedDocs(prev => [...prev, { ...doc, deletedDate: new Date() }]);
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setDeleteConfirm(null);
  };

  const restoreDocument = (docId) => {
    const doc = deletedDocs.find(d => d.id === docId);
    setDocuments(prev => [...prev, doc]);
    setDeletedDocs(prev => prev.filter(d => d.id !== docId));
  };

  const filteredDocs = useMemo(() => {
    let filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || doc.type === filterType) &&
      (filterAircraft === 'all' || doc.aircraftType === filterAircraft)
    );
    
    return filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'queries') return (b.queries || 0) - (a.queries || 0);
      return 0;
    });
  }, [documents, searchTerm, filterType, filterAircraft, sortBy]);

  const toggleFavorite = (messageIdx) => {
    const msg = messages[messageIdx];
    if (favorites.find(f => f.content === msg.content)) {
      setFavorites(prev => prev.filter(f => f.content !== msg.content));
    } else {
      setFavorites(prev => [...prev, { ...msg, savedAt: new Date() }]);
    }
  };

  const exportConversation = () => {
    const text = messages.map(m => `[${m.type}] ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversacion-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const startNewConversation = () => {
    const newConv = {
      id: Date.now(),
      title: 'Nueva Conversación',
      messages: [{
        type: 'system',
        content: 'Nueva conversación iniciada. ¿En qué puedo ayudarte?',
        timestamp: new Date()
      }],
      timestamp: new Date()
    };
    setMessages(newConv.messages);
    setCurrentConversation(newConv);
    setConversationHistory(prev => [newConv, ...prev]);
  };

  const loadConversation = (conv) => {
    setMessages(conv.messages);
    setCurrentConversation(conv);
  };

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4 animate-pulse">
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Cockpit Assistant</h1>
            <p className="text-blue-300 text-lg">Boeing 787</p>
            <p className="text-slate-400 mt-2">Sistema Profesional de Consulta de Documentación</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>GPT-5 Multimodal</span>
              <span>•</span>
              <span>Análisis de Diagramas</span>
              <span>•</span>
              <span>Anti-Alucinaciones</span>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 space-y-4">
            <button onClick={() => handleLogin('pilot', 'Carlos Rodríguez')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105">
              <User className="w-5 h-5" />
              Acceder como Piloto
            </button>
            <button onClick={() => handleLogin('admin', 'Administrador Principal')} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105">
              <Shield className="w-5 h-5" />
              Acceder como Administrador
            </button>
          </div>
          <div className="mt-8 text-center text-slate-400 text-sm">
            <p>Versión 2.0.0 Pro | Todas las funcionalidades incluidas</p>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'pilot') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-slate-50'} flex`}>
        {showSidebar && (
          <div className={`w-80 ${darkMode ? 'bg-slate-800/90' : 'bg-white'} backdrop-blur-sm border-r ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex flex-col`}>
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name}</p>
                  <p className="text-xs text-slate-400">{currentUser?.role}</p>
                </div>
              </div>
              <button onClick={startNewConversation} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4" />
                Nueva Conversación
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h3 className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'} uppercase mb-2`}>Historial</h3>
                {conversationHistory.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg mb-2 ${currentConversation?.id === conv.id ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs opacity-60">{new Date(conv.timestamp).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <h3 className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'} uppercase mb-2`}>Accesos Rápidos</h3>
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(action.query)}
                    className={`w-full text-left p-2 rounded-lg mb-1 text-sm ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <div>
                <h3 className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'} uppercase mb-2`}>Manuales Disponibles</h3>
                {documents.slice(0, 5).map(doc => (
                  <div key={doc.id} className={`p-2 rounded-lg mb-1 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <header className={`${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                  <Menu className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-900'}`} />
                </button>
                <div>
                  <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Cockpit Assistant 787</h1>
                  <p className="text-sm text-slate-400">GPT-5 • Multimodal • {documents.length} documentos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                  {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                </button>
                <button onClick={exportConversation} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`} title="Exportar conversación">
                  <Download className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-900'}`} />
                </button>
                <button onClick={() => setUserRole(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-3xl ${msg.type === 'user' ? 'bg-blue-600' : msg.type === 'system' ? darkMode ? 'bg-slate-700' : 'bg-slate-200' : darkMode ? 'bg-slate-800 border border-slate-600' : 'bg-white border border-slate-300'} rounded-2xl p-4 relative`}>
                  {msg.type === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-blue-400 text-sm font-semibold">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                      </svg>
                      Cockpit Assistant
                    </div>
                  )}
                  <p className={`${msg.type === 'user' || msg.type === 'system' ? 'text-white' : darkMode ? 'text-white' : 'text-slate-900'} whitespace-pre-wrap`}>{msg.content}</p>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>
                      <p className="text-xs text-slate-400 mb-2">Fuentes consultadas:</p>
                      {msg.sources.map((s, i) => (
                        <div key={i} className="text-xs text-blue-300 flex items-center gap-2 mb-1">
                          <FileText className="w-3 h-3" />
                          {s.doc}, Pág. {s.page}
                        </div>
                      ))}
                      {msg.confidence && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${msg.confidence * 100}%` }} />
                          </div>
                          <span className="text-xs text-green-400">{(msg.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {msg.type === 'assistant' && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(idx)}
                        className={`p-1 rounded ${favorites.find(f => f.content === msg.content) ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                        title="Guardar en favoritos"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded text-slate-500 hover:text-blue-400" title="Compartir">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 mt-2">{msg.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pregunta sobre procedimientos, sistemas, limitaciones..."
                  className={`flex-1 ${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'} placeholder-slate-400 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl transition-colors flex items-center gap-2">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Las respuestas están basadas únicamente en tu documentación • Presiona Enter para enviar
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900' : 'bg-gradient-to-br from-amber-50 via-white to-slate-50'}`}>
      <header className={`${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Panel de Administración</h1>
              <p className="text-sm text-slate-400">{currentUser?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-slate-700">
              <Bell className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-900'}`} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button onClick={() => setUserRole(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg">
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2 border-b border-slate-700">
          {['documents', 'analytics', 'users', 'recycle'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-amber-500 text-amber-500' : darkMode ? 'text-slate-400' : 'text-slate-600'} font-medium`}
            >
              {tab === 'documents' && <><FileText className="w-4 h-4 inline mr-2" />Documentos</>}
              {tab === 'analytics' && <><BarChart3 className="w-4 h-4 inline mr-2" />Analytics</>}
              {tab === 'users' && <><Users className="w-4 h-4 inline mr-2" />Usuarios</>}
              {tab === 'recycle' && <><Archive className="w-4 h-4 inline mr-2" />Papelera</>}
            </button>
          ))}
        </div>
      </header>

      {showNotifications && (
        <div className="absolute right-6 top-20 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">Notificaciones</h3>
          </div>
          {notifications.map(notif => (
            <div key={notif.id} className={`p-4 border-b border-slate-700 ${notif.read ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-white">{notif.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'documents' && (
          <>
            <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6 mb-6`}>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <Upload className="w-6 h-6 text-amber-500" />
                Subir Documentos
              </h2>
              <label className={`border-2 border-dashed ${darkMode ? 'border-slate-600 hover:border-amber-500' : 'border-slate-300 hover:border-amber-500'} rounded-xl p-8 flex flex-col items-center cursor-pointer ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <Upload className="w-12 h-12 text-slate-500 mb-3" />
                <p className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>Arrastra archivos o haz clic</p>
                <p className="text-slate-400 text-sm">PDF, hasta 100MB • Procesamiento con GPT-5 Vision</p>
                <input type="file" multiple accept=".pdf" onChange={handleFileSelect} className="hidden" />
              </label>
              {uploadingFiles.map(file => (
                <div key={file.id} className={`${darkMode ? 'bg-slate-900/50' : 'bg-slate-100'} rounded-lg p-4 mt-4`}>
                  <div className="flex justify-between mb-2">
                    <span className={`${darkMode ? 'text-white' : 'text-slate-900'} text-sm font-medium`}>{file.name}</span>
                    <span className="text-amber-400 text-sm">{file.progress}%</span>
                  </div>
                  <div className={`w-full h-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-300'} rounded-full overflow-hidden`}>
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${file.progress}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Procesando con GPT-5 Vision • Extrayendo diagramas y tablas...</p>
                </div>
              ))}
            </div>

            <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Documentos ({documents.length})</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar..."
                      className={`${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'} pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    />
                  </div>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'} px-4 py-2 rounded-lg`}>
                    <option value="all">Todos los tipos</option>
                    <option value="FCOM">FCOM</option>
                    <option value="QRH">QRH</option>
                    <option value="SOP">SOP</option>
                    <option value="Manual">Manual</option>
                  </select>
                  <select value={filterAircraft} onChange={(e) => setFilterAircraft(e.target.value)} className={`${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'} px-4 py-2 rounded-lg`}>
                    <option value="all">Todos los aviones</option>
                    <option value="B787">B787</option>
                    <option value="B777">B777</option>
                    <option value="A320">A320</option>
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'} px-4 py-2 rounded-lg`}>
                    <option value="date">Por fecha</option>
                    <option value="name">Por nombre</option>
                    <option value="queries">Por consultas</option>
                  </select>
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div className={`${darkMode ? 'bg-slate-900/30' : 'bg-slate-50'} rounded-xl p-12 text-center`}>
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No se encontraron documentos</p>
                  <p className="text-slate-500 text-sm">Ajusta los filtros o sube nuevos manuales</p>
                </div>
              ) : (
                filteredDocs.map(doc => (
                  <div key={doc.id} className={`${darkMode ? 'bg-slate-900/50 hover:bg-slate-900/70' : 'bg-slate-50 hover:bg-slate-100'} rounded-xl p-4 mb-3 flex justify-between items-center transition-colors`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{doc.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">{doc.type}</span>
                          <span>{doc.aircraftType}</span>
                          <span>•</span>
                          <span>{doc.pages} páginas</span>
                          <span>•</span>
                          <span>v{doc.version}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {doc.queries || 0} consultas
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {doc.uploadDate}
                          </span>
                        </div>
                        {doc.notes && <p className="text-xs text-slate-500 mt-1">{doc.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-green-400 text-sm font-medium px-3 py-1 bg-green-400/10 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        Listo
                      </span>
                      <button onClick={() => setPreviewDoc(doc)} className="p-2 hover:bg-slate-800 rounded-lg text-blue-400" title="Vista previa">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(doc.id)} className="p-2 hover:bg-slate-800 rounded-lg text-red-400" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Hoy</p>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{queryStats.today}</p>
                <p className="text-xs text-green-400 mt-1">+12% vs ayer</p>
              </div>
              <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Esta Semana</p>
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{queryStats.week}</p>
                <p className="text-xs text-green-400 mt-1">+8% vs semana anterior</p>
              </div>
              <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Este Mes</p>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{queryStats.month}</p>
                <p className="text-xs text-green-400 mt-1">+15% vs mes anterior</p>
              </div>
              <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Documentos</p>
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{documents.length}</p>
                <p className="text-xs text-slate-400 mt-1">{documents.reduce((sum, d) => sum + d.pages, 0)} páginas totales</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4`}>Consultas Más Frecuentes</h3>
                {queryStats.topQueries.map((q, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{q.query}</p>
                      <span className="text-sm font-semibold text-amber-500">{q.count}</span>
                    </div>
                    <div className={`h-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                      <div className="h-full bg-amber-500" style={{ width: `${(q.count / queryStats.topQueries[0].count) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4`}>Documentos Más Consultados</h3>
                {queryStats.topDocs.map((d, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{d.doc}</p>
                      <span className="text-sm font-semibold text-blue-500">{d.queries}</span>
                    </div>
                    <div className={`h-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                      <div className="h-full bg-blue-500" style={{ width: `${(d.queries / queryStats.topDocs[0].queries) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6`}>Gestión de Usuarios</h2>
            {users.map(user => (
              <div key={user.id} className={`${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} rounded-xl p-4 mb-3 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{user.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      <span>{user.role}</span>
                      <span>•</span>
                      <span>{user.license}</span>
                      <span>•</span>
                      <span>{user.queries} consultas</span>
                      <span>•</span>
                      <span>Último acceso: {user.lastLogin}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${user.active ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                  >
                    {user.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recycle' && (
          <div className={`${darkMode ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-6`}>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6`}>Papelera de Documentos</h2>
            {deletedDocs.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">La papelera está vacía</p>
              </div>
            ) : (
              deletedDocs.map(doc => (
                <div key={doc.id} className={`${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} rounded-xl p-4 mb-3 flex justify-between items-center`}>
                  <div>
                    <h3 className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{doc.name}</h3>
                    <p className="text-sm text-slate-400">Eliminado: {new Date(doc.deletedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreDocument(doc.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                    >
                      Restaurar
                    </button>
                    <button
                      onClick={() => setDeletedDocs(prev => prev.filter(d => d.id !== doc.id))}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      Eliminar permanentemente
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex justify-between items-center`}>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Configurar Documentos</h3>
              <button onClick={() => { setShowUploadModal(false); setSelectedFiles([]); }} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedFiles.map((file, i) => (
                <div key={i} className={`${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} rounded-xl p-4 space-y-3`}>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Nombre del archivo</label>
                    <input
                      type="text"
                      value={file.name}
                      onChange={(e) => updateFileMetadata(i, 'name', e.target.value)}
                      className={`w-full ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} border ${darkMode ? 'border-slate-600' : 'border-slate-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Tipo</label>
                      <select
                        value={file.type}
                        onChange={(e) => updateFileMetadata(i, 'type', e.target.value)}
                        className={`w-full ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} border ${darkMode ? 'border-slate-600' : 'border-slate-300'} rounded-lg px-3 py-2`}
                      >
                        <option>FCOM</option>
                        <option>QRH</option>
                        <option>SOP</option>
                        <option>FCTM</option>
                        <option>MEL</option>
                        <option>Manual</option>
                        <option>Boletín</option>
                        <option>Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Avión</label>
                      <select
                        value={file.aircraftType}
                        onChange={(e) => updateFileMetadata(i, 'aircraftType', e.target.value)}
                        className={`w-full ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} border ${darkMode ? 'border-slate-600' : 'border-slate-300'} rounded-lg px-3 py-2`}
                      >
                        <option>B787</option>
                        <option>B777</option>
                        <option>B737</option>
                        <option>A320</option>
                        <option>A350</option>
                        <option>General</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Versión</label>
                      <input
                        type="text"
                        value={file.version}
                        onChange={(e) => updateFileMetadata(i, 'version', e.target.value)}
                        placeholder="ej: 2.3"
                        className={`w-full ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} border ${darkMode ? 'border-slate-600' : 'border-slate-300'} rounded-lg px-3 py-2`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Notas (opcional)</label>
                    <textarea
                      value={file.notes}
                      onChange={(e) => updateFileMetadata(i, 'notes', e.target.value)}
                      placeholder="Añade comentarios sobre este documento..."
                      className={`w-full ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} border ${darkMode ? 'border-slate-600' : 'border-slate-300'} rounded-lg px-3 py-2 resize-none`}
                      rows="2"
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex gap-3 justify-end`}>
              <button
                onClick={() => { setShowUploadModal(false); setSelectedFiles([]); }}
                className={`px-6 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} ${darkMode ? 'text-white' : 'text-slate-900'} rounded-lg`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpload}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Subir {selectedFiles.length} {selectedFiles.length === 1 ? 'documento' : 'documentos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`p-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{previewDoc.name}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {previewDoc.type} • {previewDoc.aircraftType} • v{previewDoc.version} • {previewDoc.pages} páginas • {previewDoc.queries || 0} consultas
                </p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className={`${darkMode ? 'bg-slate-900/50' : 'bg-slate-100'} rounded-xl p-8 text-center`}>
                <FileText className="w-24 h-24 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">Vista Previa del Documento</p>
                <p className="text-slate-500 text-sm mb-4">En producción, aquí se mostrará el contenido del PDF</p>
                <div className="space-y-2 text-left max-w-xl mx-auto text-sm text-slate-400">
                  <p>📄 <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Páginas:</strong> {previewDoc.pages}</p>
                  <p>🤖 <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Procesado con:</strong> GPT-5 Vision (Multimodal)</p>
                  <p>📊 <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Estado:</strong> <span className="text-green-400">Listo para consultas</span></p>
                  <p>📅 <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Fecha:</strong> {previewDoc.uploadDate}</p>
                  <p>🔥 <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Consultas:</strong> {previewDoc.queries || 0} veces consultado</p>
                  {previewDoc.notes && <p>📝 <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Notas:</strong> {previewDoc.notes}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl border border-red-900/50 max-w-md w-full p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Eliminar Documento</h3>
                <p className="text-sm text-slate-400">Se moverá a la papelera</p>
              </div>
            </div>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-6`}>
              ¿Estás seguro de que quieres eliminar este documento? Podrás restaurarlo desde la papelera.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} ${darkMode ? 'text-white' : 'text-slate-900'} rounded-lg`}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteDocument(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}