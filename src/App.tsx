import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Divide, 
  Minus, 
  Plus, 
  X, 
  RotateCcw, 
  Delete, 
  Percent,
  Equal,
  History,
  Settings,
  Camera,
  RefreshCw,
  X as CloseIcon,
  Check,
  BrainCircuit
} from "lucide-react";
import { solveMathProblem } from "./services/geminiService";

export default function App() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [isResult, setIsResult] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [history, setHistory] = useState<{ id: string; exp: string; res: string; timestamp: number }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const activateCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setShowDrawer(false);
      setCapturedImage(null);
      setAiResult(null);
    } catch (err) {
      console.error("Camera access denied or error:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleConfirmSolve = async () => {
    if (!capturedImage) return;
    setIsSolving(true);
    setAiResult(null);
    try {
      const result = await solveMathProblem(capturedImage);
      setAiResult(result);
      
      // Parse result to try to extract the number for the calculator display
      const match = result.match(/Result:\s*([\d.]+)/i);
      if (match && match[1]) {
        setDisplay(match[1]);
        setIsResult(true);
      }
    } catch (err) {
      console.error("Solve error:", err);
      setAiResult("عذراً، حدث خطأ أثناء حل المسألة.");
    } finally {
      setIsSolving(false);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setShowCamera(false);
    setCapturedImage(null);
    setIsSolving(false);
    setAiResult(null);
  };

  React.useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handleNumber = (num: string) => {
    if (isResult) {
      setDisplay(num);
      setIsResult(false);
    } else {
      setDisplay(prev => (prev === "0" ? num : prev + num));
    }
  };

  const handleOperator = (op: string) => {
    setIsResult(false);
    setExpression(display + " " + op + " ");
    setDisplay("0");
  };

  const calculate = () => {
    if (expression === "") return;
    try {
      const fullExpression = expression + display;
      const sanitized = fullExpression.replace(/×/g, "*").replace(/÷/g, "/");
      const result = eval(sanitized);
      const formattedResult = String(Number(result.toFixed(8)));
      
      // Save to history
      const newEntry = {
        id: crypto.randomUUID(),
        exp: fullExpression,
        res: formattedResult,
        timestamp: Date.now()
      };
      setHistory(prev => [newEntry, ...prev]);

      setDisplay(formattedResult);
      setExpression("");
      setIsResult(true);
    } catch (e) {
      setDisplay("Error");
      setExpression("");
    }
  };

  const clear = () => {
    setDisplay("0");
    setExpression("");
    setIsResult(false);
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handlePercent = () => {
    setDisplay(prev => String(parseFloat(prev) / 100));
  };

  const handleDecimal = () => {
    if (!display.includes(".")) {
      setDisplay(prev => prev + ".");
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const restoreHistory = (item: { exp: string; res: string }) => {
    // Restore logic: put the result back to display and allow further calculation
    setExpression(item.exp + " = ");
    setDisplay(item.res);
    setIsResult(true);
    setShowHistory(false);
  };

  const buttons = [
    { label: "C", icon: <RotateCcw className="w-5 h-5" />, type: "special", color: "text-rose-400", action: clear },
    { label: "⌫", icon: <Delete className="w-5 h-5" />, type: "special", color: "text-amber-400", action: deleteLast },
    { label: "%", icon: <Percent className="w-5 h-5" />, type: "special", color: "text-emerald-400", action: handlePercent },
    { label: "/", icon: <Divide className="w-5 h-5" />, type: "operator", color: "text-indigo-400", action: () => handleOperator("/") },
    { label: "7", type: "number", action: () => handleNumber("7") },
    { label: "8", type: "number", action: () => handleNumber("8") },
    { label: "9", type: "number", action: () => handleNumber("9") },
    { label: "*", icon: <X className="w-5 h-5" />, type: "operator", color: "text-indigo-400", action: () => handleOperator("*") },
    { label: "4", type: "number", action: () => handleNumber("4") },
    { label: "5", type: "number", action: () => handleNumber("5") },
    { label: "6", type: "number", action: () => handleNumber("6") },
    { label: "-", icon: <Minus className="w-5 h-5" />, type: "operator", color: "text-indigo-400", action: () => handleOperator("-") },
    { label: "1", type: "number", action: () => handleNumber("1") },
    { label: "2", type: "number", action: () => handleNumber("2") },
    { label: "3", type: "number", action: () => handleNumber("3") },
    { label: "+", icon: <Plus className="w-5 h-5" />, type: "operator", color: "text-indigo-400", action: () => handleOperator("+") },
    { label: "00", type: "number", action: () => handleNumber("00") },
    { label: "0", type: "number", action: () => handleNumber("0") },
    { label: ".", type: "number", action: handleDecimal },
    { label: "=", icon: <Equal className="w-6 h-6" />, type: "equal", color: "bg-indigo-500 hover:bg-indigo-400", action: calculate },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: "easeOut",
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden overscroll-none transition-colors duration-500 ${
      isDarkMode 
        ? "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white" 
        : "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900"
    }`}>
      {/* Dynamic Background Elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-500 ${
        isDarkMode ? "bg-indigo-500/10" : "bg-indigo-500/20"
      }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-500 ${
        isDarkMode ? "bg-rose-500/10" : "bg-rose-500/20"
      }`} />

      <motion.div 
        initial="hidden"
        animate={["visible", "floating"]}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
              duration: 0.8, 
              ease: "easeOut",
              staggerChildren: 0.03
            }
          },
          floating: {
            y: [0, -12, 0],
            transition: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        }}
        className={`w-full max-w-[400px] sm:max-w-[380px] p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] relative z-10 flex flex-col max-h-[90vh] overflow-hidden transition-all duration-500 ${
          isDarkMode 
            ? "glass border-white/[0.1]" 
            : "bg-white/70 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] text-slate-800"
        }`}
        id="calculator-container"
      >
        {/* Header/Title */}
        <div className="flex items-center justify-center mb-6 sm:mb-8 opacity-60 px-2 flex-shrink-0" id="header">
          <span className="text-xs sm:text-sm font-medium tracking-widest uppercase">الحاسبة الذكية</span>
        </div>

        {/* Display Area */}
        <div className="mb-6 sm:mb-10 px-2 text-right flex-shrink-0" id="display-area">
          <motion.div 
            key={expression}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.4, y: 0 }}
            className="text-base sm:text-lg font-light mb-1 sm:mb-2 h-7 overflow-hidden whitespace-nowrap"
          >
            {expression}
          </motion.div>
          <motion.div 
            key={display}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-semibold tracking-tight truncate dir-ltr transition-all duration-300 ${
              display.length > 8 ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"
            }`}
          >
            {display}
          </motion.div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 flex-grow" id="buttons-grid">
          {buttons.map((btn, index) => (
            <motion.button
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={btn.action}
              className={`
                aspect-square sm:h-16 glass-button text-lg sm:text-xl font-medium
                ${btn.type === "equal" ? `col-span-1 shadow-lg shadow-indigo-500/25 ${btn.color}` : ""}
                ${btn.type !== "equal" ? (isDarkMode ? "bg-white/[0.03]" : "bg-slate-900/[0.04]") : ""}
                ${btn.color && btn.type !== "equal" ? btn.color : ""}
                ${!isDarkMode && btn.type === "number" ? "text-slate-700" : ""}
              `}
              id={`btn-${btn.label}`}
            >
              <AnimatePresence mode="wait">
                {btn.icon ? (
                  <motion.span 
                    key="icon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {btn.icon}
                  </motion.span>
                ) : (
                  <motion.span 
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {btn.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Bottom Interactive Dock */}
        <div className="mt-8 relative" id="dock-area">
          <motion.div 
            className="flex justify-center cursor-pointer group p-2"
            onClick={() => setShowDrawer(true)}
            whileHover={{ scale: 1.1 }}
          >
            <div className={`w-16 h-1.5 rounded-full transition-all duration-300 ${
              isDarkMode 
                ? "bg-white/20 group-hover:bg-white/40" 
                : "bg-slate-900/10 group-hover:bg-slate-900/25 shadow-sm"
            }`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Global Modals Area */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Backdrop Overlay - Full Screen */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`w-full max-w-[320px] py-10 px-8 rounded-[40px] relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center transition-all duration-500 ${
                  isDarkMode ? "glass" : "bg-white/90 backdrop-blur-2xl border border-white/20 text-slate-800"
                }`}
              >
                <button 
                  onClick={() => setShowDrawer(false)}
                  className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
                    isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                  id="close-menu-btn"
                >
                  <CloseIcon className={`w-5 h-5 ${isDarkMode ? "opacity-40" : "opacity-60"}`} />
                </button>
                
                <h3 className={`text-xs font-medium tracking-[0.2em] uppercase mb-10 opacity-50 px-4 text-center ${
                  !isDarkMode && "text-slate-500"
                }`}>
                  إعدادات التطبيق
                </h3>
                
                <div className="grid grid-cols-1 gap-4 w-full">
                  <motion.button 
                    whileHover={{ x: 5, backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowHistory(true);
                      setShowDrawer(false);
                    }}
                    className={`flex items-center gap-4 rounded-3xl border transition-all p-5 w-full text-right ${
                      isDarkMode 
                        ? "bg-white/[0.03] border-white/5" 
                        : "bg-slate-900/[0.03] border-slate-900/5"
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-indigo-500/20" : "bg-indigo-500/10"}`}>
                      <History className={`w-6 h-6 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${isDarkMode ? "text-white/90" : "text-slate-800"}`}>المحفوظات</span>
                      <span className={`text-[10px] opacity-40 ${isDarkMode ? "" : "text-slate-600"}`}>عرض العمليات السابقة</span>
                    </div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ x: 5, backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={activateCamera}
                    className={`flex items-center gap-4 rounded-3xl border transition-all p-5 w-full text-right ${
                      isDarkMode 
                        ? "bg-white/[0.03] border-white/5" 
                        : "bg-slate-900/[0.03] border-slate-900/5"
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-rose-500/20" : "bg-rose-500/10"}`}>
                      <Camera className={`w-6 h-6 ${isDarkMode ? "text-rose-400" : "text-rose-600"}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${isDarkMode ? "text-white/90" : "text-slate-800"}`}>الكاميرا</span>
                      <span className={`text-[10px] opacity-40 ${isDarkMode ? "" : "text-slate-600"}`}>تفعيل الكاميرا الحية</span>
                    </div>
                  </motion.button>

                <motion.button 
                  whileHover={{ x: 5, backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowSettings(true);
                    setShowDrawer(false);
                  }}
                  className={`flex items-center gap-4 rounded-3xl border transition-all p-5 w-full text-right ${
                    isDarkMode 
                      ? "bg-white/[0.03] border-white/5" 
                      : "bg-slate-900/[0.03] border-slate-900/5"
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-emerald-500/20" : "bg-emerald-500/10"}`}>
                    <Settings className={`w-6 h-6 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isDarkMode ? "text-white/90" : "text-slate-800"}`}>الإعدادات</span>
                    <span className={`text-[10px] opacity-40 ${isDarkMode ? "" : "text-slate-600"}`}>تخصيص واجهة المستخدم</span>
                  </div>
                </motion.button>
              </div>

              <div className="mt-10 w-12 h-1 bg-white/10 rounded-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-[340px] p-8 rounded-[40px] relative z-10 shadow-2xl flex flex-col items-center transition-all duration-500 ${
                isDarkMode ? "glass" : "bg-white border border-white/20 text-slate-800"
              }`}
            >
              <button 
                onClick={() => setShowSettings(false)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
                  isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100"
                }`}
              >
                <CloseIcon className={`w-5 h-5 ${isDarkMode ? "opacity-40" : "opacity-60"}`} />
              </button>
              
              <h3 className={`text-xs font-medium tracking-[0.2em] uppercase mb-10 opacity-50 px-4 text-center ${
                !isDarkMode && "text-slate-500"
              }`}>
                الإعدادات
              </h3>
              
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">الوضع الليلي</span>
                    <span className="text-[10px] opacity-40">تبديل بين الفاتح والداكن</span>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${
                      isDarkMode ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  >
                    <motion.div 
                      animate={{ x: isDarkMode ? 24 : 4 }}
                      className={`absolute top-1 left-0 w-6 h-6 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                        isDarkMode ? "bg-white" : "bg-white"
                      }`}
                    >
                      {isDarkMode ? (
                        <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                      ) : (
                        <div className="w-3 h-3 bg-slate-300 rounded-full" />
                      )}
                    </motion.div>
                  </button>
                </div>
              </div>

              <div className={`mt-12 w-12 h-1 rounded-full ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-[340px] h-[500px] rounded-[40px] relative z-10 shadow-2xl flex flex-col p-8 overflow-hidden transition-all duration-500 ${
                isDarkMode ? "glass" : "bg-white border border-white/20 text-slate-800"
              }`}
            >
              <div className={`flex items-center justify-between mb-8 opacity-60 ${!isDarkMode && "text-slate-500"}`}>
                <span className="text-xs font-medium tracking-widest uppercase">تاريخ العمليات</span>
                <button onClick={() => setShowHistory(false)} className={`p-1 rounded-full ${isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                    <History className="w-12 h-12" />
                    <span className="text-xs">لا توجد عمليات سابقة</span>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-3xl border group relative transition-all ${
                        isDarkMode 
                          ? "glass bg-white/[0.02] border-white/5" 
                          : "bg-slate-50 border-slate-100 shadow-sm"
                      }`}
                    >
                      <div className={`text-[10px] opacity-30 mb-1 ${!isDarkMode && "text-slate-500"}`}>
                        {new Date(item.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`text-xs opacity-50 truncate mb-1 text-left dir-ltr ${!isDarkMode && "text-slate-600"}`}>{item.exp}</div>
                      <div className={`text-lg font-semibold text-left dir-ltr ${isDarkMode ? "text-white/90" : "text-slate-800"}`}>= {item.res}</div>
                      
                      {/* Actions Overlay */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
                          title="حذف"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => restoreHistory(item)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors"
                          title="استعادة"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="mt-8 flex justify-center flex-shrink-0">
                <button 
                  onClick={() => setHistory([])}
                  className="text-[10px] opacity-40 hover:opacity-100 transition-opacity underline underline-offset-4"
                >
                  مسح جميع السجلات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera View Overlay */}
      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 overflow-hidden text-white">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full h-full flex flex-col items-center justify-center font-sans"
            >
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera Overlays */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
                <div className="flex justify-between items-center w-full pointer-events-auto">
                  <div className="flex flex-col text-right">
                    <span className="text-white text-xs font-medium tracking-widest uppercase opacity-60">البث المباشر</span>
                    <span className="text-emerald-400 text-[10px] font-bold animate-pulse uppercase tracking-tighter">Live • نشط</span>
                  </div>
                  <button 
                    onClick={closeCamera}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex flex-col items-center gap-8 pointer-events-auto pb-8">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full border-4 border-white/30 p-1 flex items-center justify-center cursor-pointer group"
                  >
                    <div className="w-full h-full rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform" />
                  </motion.button>
                  <div className="flex gap-4">
                     <span className="text-white text-[10px] font-medium tracking-widest uppercase opacity-40 bg-black/40 py-2 px-4 rounded-full backdrop-blur-md border border-white/5">
                      فيديو
                    </span>
                    <span className="text-white text-[10px] font-medium tracking-widest uppercase opacity-80 bg-white/20 py-2 px-4 rounded-full backdrop-blur-md border border-white/10">
                      صورة
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Decorative Corner Guides */}
              <div className="absolute inset-x-8 inset-y-24 pointer-events-none border border-white/10 rounded-[40px]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-[40px]" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-[40px]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-[40px]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-[40px]" />
                
                {/* Scanning Line Animation */}
                <motion.div 
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[1px] bg-indigo-500/30 blur-[1px]"
                />
              </div>

              {/* Preview Overlay */}
              <AnimatePresence>
                {capturedImage && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black z-10 flex flex-col items-center justify-center"
                  >
                    <img src={capturedImage} className="w-full h-full object-cover opacity-80" alt="Captured" />
                    
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                      <h2 className="text-2xl font-bold mb-4">هل تريد حل هذه المسألة؟</h2>
                      <p className="opacity-60 mb-12 text-sm max-w-[280px]">تأكد من وضوح المسألة في الصورة للحصول على أفضل النتائج الذكية</p>
                      
                      <div className="flex gap-4 w-full max-w-[320px]">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCapturedImage(null)}
                          className="flex-1 py-4 px-6 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                          إعادة التقاط
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConfirmSolve}
                          className="flex-1 py-4 px-6 rounded-2xl bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                        >
                          <BrainCircuit className="w-5 h-5" />
                          حل الآن
                        </motion.button>
                      </div>

                      <button 
                        onClick={() => setCapturedImage(null)}
                        className="mt-8 opacity-40 hover:opacity-100 transition-opacity text-sm underline"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Solving Overlay */}
              <AnimatePresence>
                {isSolving && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0f172a] z-50 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="relative mb-12">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 rounded-full border-4 border-dashed border-indigo-500/30 overflow-hidden"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <BrainCircuit className="w-12 h-12 text-indigo-400" />
                      </motion.div>
                    </div>
                    
                    <h2 className="text-3xl font-bold mb-4 tracking-tight">جاري الذكاء...</h2>
                    <div className="space-y-2">
                      <p className="text-indigo-400 font-medium tracking-widest text-[10px] uppercase">يقوم Gemini بتحليل الصورة</p>
                      <motion.p 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="opacity-40 text-sm"
                      >
                        يتم التحقق من النتيجة 3 مرات لضمان الدقة
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result Overlay */}
              <AnimatePresence>
                {aiResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-x-6 bottom-12 z-[60] glass p-8 rounded-[40px] border border-white/10 shadow-2xl flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                      <Check className="w-6 h-6 text-emerald-400" />
                    </div>
                    
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase mb-4 opacity-50 underline decoration-indigo-500 underline-offset-8">النتيجة النهائية</h3>
                    
                    <div className="w-full bg-white/5 rounded-3xl p-6 mb-8 text-right dir-rtl">
                      <p className="text-white/90 text-lg leading-relaxed whitespace-pre-line font-sans">{aiResult}</p>
                    </div>

                    <div className="flex gap-4 w-full">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAiResult(null)}
                        className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/10"
                      >
                        إغلاق
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setAiResult(null);
                          closeCamera();
                        }}
                        className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white font-bold"
                      >
                        العودة للحاسبة
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-20 right-[15%] w-12 h-12 rounded-xl flex items-center justify-center hidden lg:flex transition-all duration-500 ${
          isDarkMode ? "glass opacity-20" : "bg-white/40 border border-white/20 shadow-sm opacity-60"
        }`}
      >
        <Plus className="w-6 h-6" />
      </motion.div>
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={`absolute bottom-20 left-[15%] w-16 h-16 rounded-2xl flex items-center justify-center hidden lg:flex transition-all duration-500 ${
          isDarkMode ? "glass opacity-10" : "bg-white/40 border border-white/20 shadow-sm opacity-40"
        }`}
      >
        <Divide className="w-8 h-8" />
      </motion.div>
    </div>
  );
}

