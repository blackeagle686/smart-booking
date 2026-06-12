import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Sparkles, AlertCircle, Compass, HelpCircle, Maximize2, Minimize2, Reply, History, Calendar, Image as ImageIcon, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';
import './chatbot/Chatbot.css';
import { InlineCarousel, InlineMap, InlineBookingForm, InlineBookingWidget, InlineItinerary } from './chatbot/ChatbotWidgets';

let DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const remarkPluginsList = [remarkGfm];

const Chatbot = () => {
  const navigate = useNavigate();

  const markdownComponents = useMemo(() => ({
    p: ({ node, ...props }) => <p style={{ margin: '0 0 0.75rem 0', lineHeight: '1.6' }} {...props} />,
    ul: ({ node, ...props }) => <ul style={{ margin: '0.75rem 0', paddingLeft: '1.5rem', listStyleType: 'disc' }} {...props} />,
    ol: ({ node, ...props }) => <ol style={{ margin: '0.75rem 0', paddingLeft: '1.5rem', listStyleType: 'decimal' }} {...props} />,
    li: ({ node, ...props }) => <li style={{ marginBottom: '0.4rem', lineHeight: '1.5' }} {...props} />,
    h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '1.2rem 0 0.6rem 0', color: 'var(--color-1)', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.3rem' }} {...props} />,
    h4: ({ node, ...props }) => <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '1rem 0 0.5rem 0', color: 'var(--text-primary)' }} {...props} />,
    blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '4px solid var(--color-1)', margin: '1rem 0', padding: '0.5rem 1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '0 8px 8px 0', color: '#475569', fontStyle: 'italic' }} {...props} />,
    table: ({ node, ...props }) => <div style={{ overflowX: 'auto', margin: '1rem 0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }} {...props} /></div>,
    th: ({ node, ...props }) => <th style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#334155' }} {...props} />,
    td: ({ node, ...props }) => <td style={{ borderBottom: '1px solid #e2e8f0', padding: '0.75rem', color: '#475569' }} {...props} />,
    code: ({ node, inline, className, children, ...props }) => {
      return <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.85em', color: '#0f172a' }} {...props}>{children}</code>
    },
    a: ({ node, href, children, ...props }) => {
      if (href && href.startsWith('/')) {
        return (
          <a href={href} onClick={(e) => { e.preventDefault(); navigate(href); }} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--color-1)', textDecoration: 'none', fontWeight: '700', borderBottom: '2px solid transparent', transition: 'border-color 0.2s ease, color 0.2s ease', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.borderBottom = '2px solid var(--color-1)'; e.currentTarget.style.color = 'var(--color-2)'; }} onMouseOut={(e) => { e.currentTarget.style.borderBottom = '2px solid transparent'; e.currentTarget.style.color = 'var(--color-1)'; }} {...props}>{children}</a>
        );
      }
      return <a href={href} style={{ color: 'var(--color-1)', textDecoration: 'underline' }} target="_blank" rel="noreferrer" {...props}>{children}</a>
    },
    strong: ({ node, ...props }) => <strong style={{ fontWeight: 'bold' }} {...props} />
  }), [navigate]);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatWidth, setChatWidth] = useState(550); // Increased default width
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const resizeRef = useRef({ startX: 0, startWidth: 0 });
  const [replyTo, setReplyTo] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Marhaban! 🌴 Welcome to SmartBooking. I'm your AI concierge. I can help you search for cities, explore hotels, find the best deals, or book a room. Ask me anything!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const cityPalettes = {
    default: {
      '--color-1': '#007f5f', '--color-2': '#2b9348', '--color-3': '#55a630', '--color-4': '#80b918', '--color-5': '#aacc00',
      '--color-6': '#bfd200', '--color-7': '#d4d700', '--color-8': '#dddf00', '--color-9': '#eeef20', '--color-10': '#ffff3f',
    },
    cairo: { // Orange
      '--color-1': '#ea580c', '--color-2': '#f97316', '--color-3': '#fb923c', '--color-4': '#fdba74', '--color-5': '#fed7aa',
      '--color-6': '#ffedd5', '--color-7': '#fff7ed', '--color-8': '#ffffff', '--color-9': '#ffffff', '--color-10': '#ffffff',
    },
    sina: { // Purple
      '--color-1': '#7e22ce', '--color-2': '#9333ea', '--color-3': '#a855f7', '--color-4': '#c084fc', '--color-5': '#d8b4fe',
      '--color-6': '#e9d5ff', '--color-7': '#f3e8ff', '--color-8': '#faf5ff', '--color-9': '#ffffff', '--color-10': '#ffffff',
    },
    aswan: { // Royal Blue
      '--color-1': '#1d4ed8', '--color-2': '#2563eb', '--color-3': '#3b82f6', '--color-4': '#60a5fa', '--color-5': '#93c5fd',
      '--color-6': '#bfdbfe', '--color-7': '#dbeafe', '--color-8': '#eff6ff', '--color-9': '#ffffff', '--color-10': '#ffffff',
    },
    alex: { // Cyan
      '--color-1': '#0891b2', '--color-2': '#06b6d4', '--color-3': '#22d3ee', '--color-4': '#67e8f9', '--color-5': '#a5f3fc',
      '--color-6': '#cffafe', '--color-7': '#ecfeff', '--color-8': '#f8fafc', '--color-9': '#ffffff', '--color-10': '#ffffff',
    },
    matrouh: { // Turquoise/Light Blue
      '--color-1': '#0284c7', '--color-2': '#0ea5e9', '--color-3': '#38bdf8', '--color-4': '#7dd3fc', '--color-5': '#bae6fd',
      '--color-6': '#e0f2fe', '--color-7': '#f0f9ff', '--color-8': '#ffffff', '--color-9': '#ffffff', '--color-10': '#ffffff',
    },
    redsea: { // Teal / Ocean
      '--color-1': '#0f766e', '--color-2': '#0d9488', '--color-3': '#14b8a6', '--color-4': '#2dd4bf', '--color-5': '#5eead4',
      '--color-6': '#99f6e4', '--color-7': '#ccfbf1', '--color-8': '#f0fdfa', '--color-9': '#ffffff', '--color-10': '#ffffff',
    },
    portsaied: { // Golden
      '--color-1': '#ca8a04', '--color-2': '#eab308', '--color-3': '#facc15', '--color-4': '#fde047', '--color-5': '#fef08a',
      '--color-6': '#fef9c3', '--color-7': '#fefce8', '--color-8': '#ffffff', '--color-9': '#ffffff', '--color-10': '#ffffff',
    },
    sharm: { // Coral/Pink
      '--color-1': '#be123c', '--color-2': '#e11d48', '--color-3': '#f43f5e', '--color-4': '#fb7185', '--color-5': '#fda4af',
      '--color-6': '#fecdd3', '--color-7': '#ffe4e6', '--color-8': '#fff1f2', '--color-9': '#ffffff', '--color-10': '#ffffff',
    }
  };

  // Ensure DOM colors transition smoothly
  useEffect(() => {
    document.documentElement.style.setProperty('transition', 'all 0.5s ease-in-out');
  }, []);

  // Theme Engine hook
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'bot') {
        const text = lastMsg.text.toLowerCase();

        // Match the 8 cities
        const cities = [
          { key: 'cairo', terms: ['cairo'] },
          { key: 'sina', terms: ['sina'] },
          { key: 'aswan', terms: ['aswan'] },
          { key: 'alex', terms: ['alex', 'alexandria'] },
          { key: 'matrouh', terms: ['matrouh'] },
          { key: 'redsea', terms: ['redsea', 'red sea'] },
          { key: 'portsaied', terms: ['port saied', 'portsaied', 'port said'] },
          { key: 'sharm', terms: ['sharm el sheckh', 'sharm', 'sharm el sheikh'] }
        ];

        let foundTheme = null;
        let minIndex = Infinity;

        for (const cityObj of cities) {
          for (const term of cityObj.terms) {
            const idx = text.indexOf(term);
            if (idx !== -1 && idx < minIndex) {
              minIndex = idx;
              foundTheme = cityObj.key;
            }
          }
        }

        const themeToApply = foundTheme || 'default';
        const palette = cityPalettes[themeToApply];
        for (const [key, value] of Object.entries(palette)) {
          document.documentElement.style.setProperty(key, value);
        }
      }
    }
  }, [messages]);

  const messagesEndRef = useRef(null);

  // Global drag listeners
  useEffect(() => {
    const handleDragEnter = (e) => {
      // Browsers often only expose text/plain or text/uri-list during dragenter
      // We will blindly allow it to highlight
      setIsDragOver(true);
    };

    window.addEventListener('dragenter', handleDragEnter);
    return () => window.removeEventListener('dragenter', handleDragEnter);
  }, []);

  const currentTokenRef = useRef(localStorage.getItem('access'));

  // Check auth status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access');
      setIsAuthenticated(!!token);

      if (token !== currentTokenRef.current) {
        currentTokenRef.current = token;
        // Reset chat session state when user switches accounts
        setMessages([
          {
            sender: 'bot',
            text: "Marhaban! 🌴 Welcome to SmartBooking. I'm your AI concierge. I can help you search for cities, explore hotels, find the best deals, or book a room. Ask me anything!",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setHistoryList([]);
        setShowHistory(false);
      }
    };

    checkAuth();
    // Listen for storage changes to handle login/logout
    window.addEventListener('storage', checkAuth);
    // Periodically poll auth state in case storage event doesn't fire in the same tab
    const interval = setInterval(checkAuth, 2000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Listen for Navbar 'Agent First' button
  useEffect(() => {
    const handleOpenFullscreen = () => {
      setIsOpen(true);
      setIsExpanded(true);
    };
    window.addEventListener('open-chatbot-fullscreen', handleOpenFullscreen);
    return () => window.removeEventListener('open-chatbot-fullscreen', handleOpenFullscreen);
  }, []);

  // Lock background body scrolling when in full-screen mode
  useEffect(() => {
    if (isOpen && isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isExpanded]);

  // Dragging logic
  const handleMouseDown = (e) => {
    // Only initiate drag on left click, and ignore clicks on buttons
    if (e.button !== 0 || e.target.closest('button')) return;
    if (isExpanded) return; // Disable dragging in full screen

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Resizing logic
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startWidth: chatWidth
    };
  };

  useEffect(() => {
    const handleResizeMouseMove = (e) => {
      if (!isResizing) return;
      const dx = e.clientX - resizeRef.current.startX;
      // Because the window is centered (-50% transform), increasing width by dx*2
      // makes the right edge follow the mouse exactly.
      setChatWidth(Math.max(400, Math.min(1200, resizeRef.current.startWidth + dx * 2)));
    };

    const handleResizeMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing]);

  const toggleHistory = async () => {
    if (!showHistory) {
      try {
        const response = await api.get('chat/');
        setHistoryList(response.data.history || []);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
    }
    setShowHistory(!showHistory);
  };

  const restoreHistory = () => {
    if (historyList.length === 0) return;
    const restored = historyList.map(item => ({
      sender: item.role === 'user' ? 'user' : 'bot',
      text: item.content,
      time: 'Restored'
    }));

    setMessages([
      {
        sender: 'bot',
        text: "Marhaban! 🌴 Welcome to SmartBooking. I'm your AI concierge. I can help you search for cities, explore hotels, find the best deals, or book a room. Ask me anything!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...restored
    ]);
    setShowHistory(false);
  };

  if (!isAuthenticated) return null;

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input.trim();
    if (!queryText) return;

    if (!textToSend) setInput('');

    // Append user message
    const userMsg = {
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build chat history for backend (excluding system messages)
      const history = messages
        .filter(m => m.sender === 'user' || m.sender === 'bot')
        .slice(-10) // Limit context to last 10 messages
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const response = await api.post('chat/', {
        message: queryText,
        history: history,
        reply_to: replyTo ? replyTo.text : null
      });

      const botMsg = {
        sender: 'bot',
        text: response.data.response || "I didn't receive a valid answer. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setReplyTo(null);
    } catch (error) {
      console.error("Chatbot Error:", error);
      const errMsg = {
        sender: 'bot',
        text: "I am having trouble connecting to my servers. Please try again in a moment.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSubmit = async (roomId, inDate, outDate, file) => {
    const queryText = `I have filled the booking form for Room ID ${roomId}. Please finalize the booking and show my details.`;
    const userMsg = {
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.sender === 'user' || m.sender === 'bot')
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const formData = new FormData();
      formData.append('message', queryText);
      formData.append('history', JSON.stringify(history));
      formData.append('check_in', inDate);
      formData.append('check_out', outDate);
      if (file) {
        formData.append('screenshot', file);
      }

      const response = await api.post('chat/', formData);
      const botMsg = {
        sender: 'bot',
        text: response.data.response || "Booking request processed.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error("Booking Error:", e);
      const errMsg = {
        sender: 'bot',
        text: "I failed to process your booking. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
  };

  const handleGlobalDragLeave = (e) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsDragOver(false);
    }
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const payload = e.dataTransfer.getData('text/plain');
      if (payload && payload.startsWith('OASIS_BOT:')) {
        const data = JSON.parse(payload.replace('OASIS_BOT:', ''));
        if (data && data.action === 'ASK_ABOUT') {
          if (!isOpen) {
            setIsOpen(true);
            setIsExpanded(true);
          }
          // Slight delay to allow Chatbot to mount/expand before sending
          setTimeout(() => {
            const queryText = data.query;
            const userMsg = {
              sender: 'user',
              text: queryText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, userMsg]);
            setIsLoading(true);

            const history = messages
              .filter(m => m.sender === 'user' || m.sender === 'bot')
              .slice(-10)
              .map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
              }));

            api.post('chat/', {
              message: queryText,
              history: history,
              reply_to: null
            }).then(response => {
              const botMsg = {
                sender: 'bot',
                text: response.data.response || "I didn't receive a valid answer. Please try again.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setMessages(prev => [...prev, botMsg]);
              setIsLoading(false);
            }).catch(error => {
              const errMsg = {
                sender: 'bot',
                text: "I am having trouble connecting to my servers. Please try again in a moment.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isError: true
              };
              setMessages(prev => [...prev, errMsg]);
              setIsLoading(false);
            });
          }, 100);
        }
      }
    } catch (err) {
      // Ignore non-JSON drops
    }
  };

  const suggestions = [
    { label: "🗺️ Explore Cities", query: "Show me the list of cities in Egypt" },
    { label: "🏨 Top Hotel Deals", query: "Find the cheapest room deals/best rates" },
    { label: "Best Room in Hurghada", query: "List all rooms in Hurghada" }
  ];

  return (
    <>


      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          className="chatbot-window"
          style={{
            top: isExpanded ? '50%' : `calc(50% + ${position.y}px)`,
            left: isExpanded ? '50%' : `calc(50% + ${position.x}px)`,
            transform: 'translate(-50%, -50%)',
            width: isExpanded ? '100vw' : `${chatWidth}px`,
            height: isExpanded ? '100vh' : '650px',
            maxWidth: isExpanded ? '100vw' : '95vw',
            maxHeight: isExpanded ? '100vh' : '95vh',
            backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: isExpanded ? 'blur(16px)' : 'blur(20px)',
            WebkitBackdropFilter: isExpanded ? 'blur(16px)' : 'blur(20px)',
            borderRadius: isExpanded ? '0px' : '24px',
            boxShadow: isExpanded ? 'none' : '0 20px 50px rgba(15, 23, 42, 0.15)',
            border: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
            transition: (isDragging || isResizing) ? 'none' : 'width 0.3s ease, height 0.3s ease',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (e.dataTransfer.types.includes('oasis_bot')) setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            try {
              const payload = e.dataTransfer.getData('oasis_bot');
              if (payload) {
                const data = JSON.parse(payload);
                if (data && data.action === 'ASK_ABOUT') {
                  setTimeout(() => handleSend(data.query), 100);
                }
              }
            } catch (err) { }
          }}
        >
          {isDragOver && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(11, 207, 73, 0.15)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px dashed var(--color-1)' }}>
              <div style={{ background: 'white', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', pointerEvents: 'none' }}>
                <Sparkles size={32} color="var(--color-1)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--color-1)', margin: 0, fontSize: '1.5rem' }}>Drop here to Ask AI!</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>I will instantly analyze this property.</p>
              </div>
            </div>
          )}
          {/* Header */}
          <div
            className="chatbot-header"
            onMouseDown={handleMouseDown}
            style={{ cursor: isExpanded ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 2 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: '46px', height: '46px', 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)', 
                  border: '1px solid rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  backdropFilter: 'blur(5px)'
                }}>
                  <img src="/smart-bookingIcon.png" alt="SmartBooking AI" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))' }} />
                </div>
                <span style={{ 
                  position: 'absolute', bottom: '-4px', right: '-4px', 
                  width: '14px', height: '14px', borderRadius: '50%', 
                  backgroundColor: '#10b981', border: '2px solid var(--color-2)',
                  boxShadow: '0 0 10px rgba(16,185,129,0.8)'
                }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>SmartBooking AI</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '0.75rem', opacity: 0.95, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Online Assistant</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 2 }}>
              <button
                onClick={toggleHistory}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', opacity: showHistory ? 1 : 0.8, borderRadius: '8px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = showHistory ? '1' : '0.8'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                title="View Chat History"
              >
                <History size={20} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', opacity: 0.8, borderRadius: '8px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(239,68,68,0.8)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', opacity: 0.9, borderRadius: '8px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239,68,68,1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.background = 'rgba(239,68,68,0.8)'; }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body content based on state */}
          {showHistory ? (
            <div className="chatbot-body" style={{ backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, color: 'var(--color-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} /> Your Recent Server History
                </h4>
                {historyList.length > 0 && (
                  <button
                    onClick={restoreHistory}
                    style={{ background: 'var(--color-1)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    Restore to Chat
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>No recent history found.</p>
              ) : (
                historyList.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.role === 'user') {
                        setInput(item.content);
                        setShowHistory(false);
                      }
                    }}
                    title={item.role === 'user' ? "Click to reuse this message" : ""}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      border: item.role === 'user' ? '1px solid var(--color-1)' : '1px solid #e2e8f0',
                      cursor: item.role === 'user' ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (item.role === 'user') {
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (item.role === 'user') {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: item.role === 'user' ? 'var(--color-1)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.role === 'user' ? 'You' : 'SmartBooking AI'}
                    </span>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                      {item.content.length > 300 ? item.content.substring(0, 300) + '...' : item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="chatbot-body">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: msg.sender === 'user' ? '18px 18px 0px 18px' : '18px 18px 18px 0px',
                    backgroundColor: msg.sender === 'user' ? 'var(--color-1)' : '#f1f5f9',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    border: msg.isError ? '1px solid #fca5a5' : 'none',
                    overflowWrap: 'break-word',
                    position: 'relative'
                  }}>
                    {/* Reply Action on Hover (Optional advanced UI pattern) */}
                    <button
                      onClick={() => setReplyTo(msg)}
                      style={{ position: 'absolute', top: '-10px', right: msg.sender === 'user' ? 'auto' : '-10px', left: msg.sender === 'user' ? '-10px' : 'auto', background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#64748b' }}
                      title="Reply to message"
                    >
                      <Reply size={14} />
                    </button>

                    {msg.isError && <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle', color: '#ef4444' }} />}
                    {msg.sender === 'user' ? (
                      <span>{msg.text}</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <div className="prose prose-sm max-w-none text-slate-700" style={{ fontSize: '0.95rem', minWidth: 0 }}>
                          {msg.text.split(/(\[GALLERY:[^\]]+\]|\[MAP:[^\]]+\]|\[BOOKING_FORM:[^\]]+\]|\[BOOKING_WIDGET:[^\]]+\]|\[ITINERARY:[^\]]+\])/gi).map((part, i) => {
                            if (!part) return null;

                            if (part.toUpperCase().startsWith('[GALLERY:')) {
                              const galRegex = /\[GALLERY:\s*([^|\]]+)\s*\|\s*([^\]]+)\]/i;
                              const match = part.match(galRegex);
                              if (match) {
                                const title = match[1].trim();
                                const images = match[2].split(',').filter(u => u.trim() !== '');
                                return (
                                  <div key={i} style={{ float: isExpanded ? 'right' : 'none', width: isExpanded ? '450px' : '100%', marginLeft: isExpanded ? '1.5rem' : '0', marginBottom: '1rem', clear: 'right' }}>
                                    <InlineCarousel title={title} images={images} />
                                  </div>
                                );
                              }
                              return null;
                            }

                            if (part.toUpperCase().startsWith('[MAP:')) {
                              const mapRegex = /\[MAP:\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^|\]]+)(?:\s*\|\s*([^|\]]*))?(?:\s*\|\s*([^|\]]*))?\]/i;
                              const match = part.match(mapRegex);
                              if (match) {
                                const lat = parseFloat(match[2]);
                                const lon = parseFloat(match[3]);
                                if (!isNaN(lat) && !isNaN(lon)) {
                                  const markers = [{
                                    title: match[1].trim(),
                                    lat,
                                    lon,
                                    image: match[4],
                                    link: match[5]
                                  }];
                                  return (
                                    <div key={i} style={{ float: isExpanded ? 'right' : 'none', width: isExpanded ? '450px' : '100%', marginLeft: isExpanded ? '1.5rem' : '0', marginBottom: '1rem', clear: 'right' }}>
                                      <InlineMap markers={markers} onNavigate={(url) => navigate(url)} />
                                    </div>
                                  );
                                }
                              }
                              return null;
                            }

                            if (part.toUpperCase().startsWith('[BOOKING_FORM:')) {
                              const match = part.match(/\[BOOKING_FORM:\s*(\d+)(?:\s*\|\s*([^|\]]*))?(?:\s*\|\s*([^|\]]*))?\]/i);
                              if (match) {
                                return (
                                  <div key={i} style={{ clear: 'both', marginTop: '1rem' }}>
                                    <InlineBookingForm
                                      roomId={match[1]}
                                      initialInDate={match[2]?.trim()}
                                      initialOutDate={match[3]?.trim()}
                                      onSubmit={handleBookingSubmit}
                                    />
                                  </div>
                                );
                              }
                              return null;
                            }

                            if (part.toUpperCase().startsWith('[BOOKING_WIDGET:')) {
                              const match = part.match(/\[BOOKING_WIDGET:\s*(\d+)\s*:\s*([^:]+)\s*:\s*([^:]+)\s*:\s*([^\]]+)\]/i);
                              if (match) {
                                return (
                                  <div key={i} style={{ clear: 'both', marginTop: '1rem', width: '100%' }}>
                                    <InlineBookingWidget
                                      roomId={match[1]}
                                      inDate={match[2]?.trim()}
                                      outDate={match[3]?.trim()}
                                      price={match[4]?.trim()}
                                      onConfirm={(roomId, inDate, outDate) => handleBookingSubmit(roomId, inDate, outDate, null)}
                                    />
                                  </div>
                                );
                              }
                              return null;
                            }

                            if (part.toUpperCase().startsWith('[ITINERARY:')) {
                              // [ITINERARY: City | Day 1: Act 1; Act 2 | Day 2: Act 1; Act 2]
                              const innerContent = part.substring(11, part.length - 1).trim();
                              const parts = innerContent.split('|').map(s => s.trim());
                              if (parts.length > 1) {
                                const title = parts[0];
                                const daysData = [];
                                for (let j = 1; j < parts.length; j++) {
                                  const daySection = parts[j];
                                  const colonIdx = daySection.indexOf(':');
                                  if (colonIdx !== -1) {
                                    const label = daySection.substring(0, colonIdx).trim();
                                    const acts = daySection.substring(colonIdx + 1).split(';').map(s => s.trim()).filter(s => s !== '');
                                    daysData.push({ label, activities: acts });
                                  }
                                }
                                return (
                                  <div key={i} style={{ clear: 'both', width: '100%' }}>
                                    <InlineItinerary title={title} daysData={daysData} />
                                  </div>
                                );
                              }
                              return null;
                            }

                            const cleanPart = part.replace(/^`+|`+$/g, '');
                            return (
                              <ReactMarkdown
                                key={i}
                                remarkPlugins={remarkPluginsList}
                                components={markdownComponents}
                              >
                                {cleanPart}
                              </ReactMarkdown>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                    {msg.time}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.1rem', borderRadius: '18px 18px 18px 0px', backgroundColor: '#f1f5f9' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-1)', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '-0.32s' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-1)', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '-0.16s' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-1)', animation: 'bounce 1.4s infinite ease-in-out' }} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Suggestions & Input Footer */}
          {!showHistory && (
            <>
              {/* Quick Suggestions */}
              {messages.length === 1 && !isLoading && (
                <div style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Suggested Topics:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s.query)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: 'var(--text-primary)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-1)';
                          e.currentTarget.style.backgroundColor = 'var(--color-1)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Footer */}
              <div className="chatbot-footer" style={{ background: isExpanded ? 'var(--color-1)' : 'white' }}>

                {replyTo && (
                  <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <Reply size={14} style={{ color: 'var(--color-1)' }} />
                      <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>Replying to:</span>
                      <span style={{ color: '#334155', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {replyTo.text}
                      </span>
                    </div>
                    <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
                  </div>
                )}

                <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Ask about cities, deals, hotels..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      border: '1px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '0.85rem 1rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-1)'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      backgroundColor: input.trim() ? 'var(--color-1)' : '#cbd5e1',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: input.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {/* Resize Handle */}
              {!isExpanded && (
                <div
                  onMouseDown={handleResizeMouseDown}
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: '20px',
                    height: '20px',
                    cursor: 'se-resize',
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                    padding: '4px'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 10 10" style={{ opacity: 0.3 }}>
                    <path d="M10 0 L10 10 L0 10 Z" fill="var(--text-primary)" />
                  </svg>
                </div>
              )}

            </>
          )}

        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000,
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-1) 0%, var(--color-3) 100%)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(30, 41, 59, 0.25)',
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={26} />
        </button>
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes scaleUpFromButton {
          0% { 
            opacity: 0; 
            transform: translate(calc(-50% + 35vw), calc(-50% + 35vh)) scale(0.05); 
            border-radius: 60px;
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>

    </>
  );
};

export default Chatbot;
