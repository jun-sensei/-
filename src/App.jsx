import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Trophy, Clock, Target, Keyboard, BookOpen, SkipForward, History, ArrowLeft, User, Trash2, Volume2, VolumeX, LogOut, Award, Star, ChevronUp } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

// ============================================================================
// 【 Firebase 設定 】
// 以下をご自身で取得した Firebase の設定情報に書き換えてください。
// （※セキュリティルールはテストモードまたは書き込み許可にしてください）
// ============================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init error", e);
}

// --- データ定義 ---
const CATEGORIES = [
  { id: 0, name: "NH1 Unit 1" }, { id: 1, name: "NH1 Unit 2" }, { id: 2, name: "NH1 Unit 3" },
  { id: 3, name: "NH1 Unit 4" }, { id: 4, name: "NH1 Unit 5" }, { id: 5, name: "NH1 Unit 6" },
  { id: 6, name: "NH1 Unit 7" }, { id: 7, name: "NH1 Unit 8" }, { id: 8, name: "NH1 Unit 9" },
  { id: 9, name: "NH1 Unit 10" }, { id: 10, name: "NH2 Unit 0" }, { id: 11, name: "NH2 Unit 1 Part 1" },
  { id: 12, name: "NH2 Unit 1 Part 2" }, { id: 13, name: "NH2 Unit 1 Read & Think" }
];

const getCategoryName = (id) => {
  const cat = CATEGORIES.find(c => c.id === id);
  return cat ? cat.name : "不明";
};

const WORD_DATA = [
  { cat: 0, en: "call", ja: "呼ぶ" }, { cat: 0, en: "love", ja: "大好きである" }, { cat: 0, en: "everyone", ja: "みんな" }, { cat: 0, en: "sweet", ja: "甘いもの" }, { cat: 0, en: "join", ja: "参加する" }, { cat: 0, en: "club", ja: "クラブ" }, { cat: 0, en: "often", ja: "よく、しばしば" }, { cat: 0, en: "friend", ja: "友達" }, { cat: 0, en: "great", ja: "すばらしい" }, { cat: 0, en: "draw", ja: "描く" }, { cat: 0, en: "comic", ja: "漫画" }, { cat: 0, en: "art", ja: "芸術" },
  { cat: 1, en: "class", ja: "クラス" }, { cat: 1, en: "our", ja: "私たちの" }, { cat: 1, en: "new", ja: "新しい" }, { cat: 1, en: "teacher", ja: "先生" }, { cat: 1, en: "team", ja: "チーム" }, { cat: 1, en: "food", ja: "食べ物" }, { cat: 1, en: "father", ja: "父" }, { cat: 1, en: "read", ja: "読む" }, { cat: 1, en: "really", ja: "本当に" }, { cat: 1, en: "excuse", ja: "許す" }, { cat: 1, en: "welcome", ja: "歓迎する" },
  { cat: 2, en: "symbol", ja: "シンボル" }, { cat: 2, en: "favorite", ja: "お気に入りの" }, { cat: 2, en: "character", ja: "キャラクター" }, { cat: 2, en: "family", ja: "家族" }, { cat: 2, en: "brave", ja: "勇敢な" }, { cat: 2, en: "kind", ja: "親切な" }, { cat: 2, en: "around", ja: "～の周りに" }, { cat: 2, en: "live", ja: "住む" }, { cat: 2, en: "study", ja: "勉強する" }, { cat: 2, en: "win", ja: "勝つ" }, { cat: 2, en: "next", ja: "次の" }, { cat: 2, en: "luck", ja: "運" }, { cat: 2, en: "practice", ja: "練習する" }, { cat: 2, en: "station", ja: "駅" },
  { cat: 3, en: "animal", ja: "動物" }, { cat: 3, en: "visit", ja: "訪れる" }, { cat: 3, en: "many", ja: "多くの" }, { cat: 3, en: "time", ja: "時間" }, { cat: 3, en: "sport", ja: "スポーツ" }, { cat: 3, en: "nervous", ja: "緊張した" }, { cat: 3, en: "worry", ja: "心配する" }, { cat: 3, en: "enjoy", ja: "楽しむ" },
  { cat: 4, en: "guide", ja: "ガイド" }, { cat: 4, en: "write", ja: "書く" }, { cat: 4, en: "local", ja: "地元の" }, { cat: 4, en: "beautiful", ja: "美しい" }, { cat: 4, en: "brother", ja: "兄弟" }, { cat: 4, en: "work", ja: "働く" }, { cat: 4, en: "nature", ja: "自然" }, { cat: 4, en: "question", ja: "質問" }, { cat: 4, en: "weekend", ja: "週末" }, { cat: 4, en: "swim", ja: "泳ぐ" }, { cat: 4, en: "popular", ja: "人気のある" }, { cat: 4, en: "know", ja: "知っている" }, { cat: 4, en: "wonderful", ja: "すばらしい" },
  { cat: 5, en: "show", ja: "ショー、見せる" }, { cat: 5, en: "together", ja: "一緒に" }, { cat: 5, en: "minute", ja: "分" }, { cat: 5, en: "wait", ja: "待つ" }, { cat: 5, en: "careful", ja: "注意深い" }, { cat: 5, en: "history", ja: "歴史" }, { cat: 5, en: "ticket", ja: "チケット" }, { cat: 5, en: "different", ja: "異なる" }, { cat: 5, en: "use", ja: "使う" }, { cat: 5, en: "clothes", ja: "服" },
  { cat: 6, en: "tomorrow", ja: "明日" }, { cat: 6, en: "plan", ja: "計画" }, { cat: 6, en: "free", ja: "自由な、暇な" }, { cat: 6, en: "busy", ja: "忙しい" }, { cat: 6, en: "talk", ja: "話す" }, { cat: 6, en: "market", ja: "市場" }, { cat: 6, en: "place", ja: "場所" }, { cat: 6, en: "people", ja: "人々" }, { cat: 6, en: "travel", ja: "旅行する" }, { cat: 6, en: "angry", ja: "怒った" }, { cat: 6, en: "sorry", ja: "申し訳ない" },
  { cat: 7, en: "volunteer", ja: "ボランティア" }, { cat: 7, en: "need", ja: "必要とする" }, { cat: 7, en: "teach", ja: "教える" }, { cat: 7, en: "respect", ja: "尊敬する" }, { cat: 7, en: "child", ja: "子ども" }, { cat: 7, en: "country", ja: "国" }, { cat: 7, en: "always", ja: "いつも" }, { cat: 7, en: "reduce", ja: "減らす" }, { cat: 7, en: "waste", ja: "無駄、ゴミ" }, { cat: 7, en: "village", ja: "村" }, { cat: 7, en: "build", ja: "建てる" }, { cat: 7, en: "money", ja: "お金" }, { cat: 7, en: "clean", ja: "きれいな" },
  { cat: 8, en: "during", ja: "～の間に" }, { cat: 8, en: "stay", ja: "滞在する" }, { cat: 8, en: "relax", ja: "リラックスする" }, { cat: 8, en: "mountain", ja: "山" }, { cat: 8, en: "vacation", ja: "休暇" }, { cat: 8, en: "traditional", ja: "伝統的な" }, { cat: 8, en: "special", ja: "特別な" }, { cat: 8, en: "spend", ja: "過ごす" }, { cat: 8, en: "wish", ja: "願い" }, { cat: 8, en: "future", ja: "未来" },
  { cat: 9, en: "remember", ja: "覚えている" }, { cat: 9, en: "realize", ja: "気づく" }, { cat: 9, en: "mistake", ja: "間違い" }, { cat: 9, en: "memory", ja: "思い出" }, { cat: 9, en: "break", ja: "休憩" }, { cat: 9, en: "heart", ja: "心臓、心" }, { cat: 9, en: "yesterday", ja: "昨日" }, { cat: 9, en: "fast", ja: "速い" }, { cat: 9, en: "trip", ja: "旅行" }, { cat: 9, en: "event", ja: "イベント" },
  { cat: 10, en: "same", ja: "同じ" }, { cat: 10, en: "experience", ja: "経験" }, { cat: 10, en: "actually", ja: "実は" }, { cat: 10, en: "instant", ja: "インスタントの" }, { cat: 10, en: "noodle", ja: "麺" }, { cat: 10, en: "ramen", ja: "ラーメン" },
  { cat: 11, en: "golden", ja: "金色の" }, { cat: 11, en: "holiday", ja: "休日" }, { cat: 11, en: "flight", ja: "フライト、飛行の便" }, { cat: 11, en: "arrive", ja: "到着する" }, { cat: 11, en: "airport", ja: "空港" }, { cat: 11, en: "soon", ja: "すぐに" },
  { cat: 12, en: "will", ja: "～するつもりだ、～でしょう" }, { cat: 12, en: "excited", ja: "わくわくした" }, { cat: 12, en: "seafood", ja: "シーフード" }, { cat: 12, en: "reservation", ja: "予約" },
  { cat: 13, en: "meter", ja: "メートル" }, { cat: 13, en: "tall", ja: "背が高い" }, { cat: 13, en: "weigh", ja: "重さがある" }, { cat: 13, en: "ton", ja: "トン" }, { cat: 13, en: "found", ja: "見つけた (findの過去形)" }, { cat: 13, en: "language", ja: "言語" }, { cat: 13, en: "dollar", ja: "ドル" }, { cat: 13, en: "example", ja: "例" }, { cat: 13, en: "communicate", ja: "コミュニケーションをとる" }, { cat: 13, en: "painting", ja: "絵" }, { cat: 13, en: "wall", ja: "壁" }, { cat: 13, en: "surprised", ja: "驚いた" }, { cat: 13, en: "area", ja: "地域" }, { cat: 13, en: "mosque", ja: "モスク" }, { cat: 13, en: "culture", ja: "文化" }
];

const LEVEL_INFO = [
  { level: 1, title: "見習いタイパー", minXP: 0, color: "text-slate-500", bg: "bg-slate-100" },
  { level: 2, title: "駆け出しタイパー", minXP: 100, color: "text-green-600", bg: "bg-green-100" },
  { level: 3, title: "一人前タイパー", minXP: 300, color: "text-teal-600", bg: "bg-teal-100" },
  { level: 4, title: "熟練タイパー", minXP: 600, color: "text-blue-600", bg: "bg-blue-100" },
  { level: 5, title: "ベテランタイパー", minXP: 1000, color: "text-indigo-600", bg: "bg-indigo-100" },
  { level: 6, title: "タイピング・マスター", minXP: 1500, color: "text-purple-600", bg: "bg-purple-100" },
  { level: 7, title: "神速のタイパー", minXP: 2500, color: "text-pink-600", bg: "bg-pink-100" },
  { level: 8, title: "伝説のタイパー", minXP: 5000, color: "text-orange-500", bg: "bg-orange-100" },
  { level: 9, title: "タイピング神", minXP: 10000, color: "text-yellow-600", bg: "bg-yellow-100" },
];

const getPlayerStatus = (xp) => {
  let currentLevel = LEVEL_INFO[0];
  let nextLevel = LEVEL_INFO[1];
  for (let i = 0; i < LEVEL_INFO.length; i++) {
    if (xp >= LEVEL_INFO[i].minXP) {
      currentLevel = LEVEL_INFO[i];
      nextLevel = LEVEL_INFO[i + 1] || null;
    } else {
      break;
    }
  }
  return { currentLevel, nextLevel };
};

const calculateEarnedXP = (qCount, timeMs, accuracy, skips) => {
  const baseXP = (qCount - skips) * 10;
  const expectedTimeMs = qCount * 4000;
  let timeBonus = 0;
  if (timeMs < expectedTimeMs) {
    timeBonus = Math.floor((expectedTimeMs - timeMs) / 1000) * 3;
  }
  let accBonus = 0;
  if (accuracy === 100) accBonus = 50;
  else if (accuracy >= 90) accBonus = 20;
  return Math.max(0, baseXP + timeBonus + accBonus);
};


export default function App() {
  const [gameState, setGameState] = useState('start'); 
  
  const [user, setUser] = useState(null);
  const [histories, setHistories] = useState([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [playerName, setPlayerName] = useState(''); 
  const [localPlayerNames, setLocalPlayerNames] = useState([]); 
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState('all');
  
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false); 
  const [startTotalXP, setStartTotalXP] = useState(0);

  useEffect(() => {
    const savedName = localStorage.getItem('typingQuiz_playerName');
    if (savedName) setPlayerName(savedName);

    const savedTTS = localStorage.getItem('typingQuiz_tts');
    if (savedTTS !== null) setIsTTSEnabled(savedTTS === 'true');

    const namesStr = localStorage.getItem('typingQuiz_localPlayerNames');
    if (namesStr) {
      try {
        setLocalPlayerNames(JSON.parse(namesStr));
      } catch (e) {}
    }
  }, []);

  const handlePlayerNameChange = (e) => {
    setPlayerName(e.target.value);
  };

  const toggleTTS = () => {
    const newState = !isTTSEnabled;
    setIsTTSEnabled(newState);
    localStorage.setItem('typingQuiz_tts', String(newState));
  };

  const [startCategory, setStartCategory] = useState(10); 
  const [endCategory, setEndCategory] = useState(13);   
  const [questionCount, setQuestionCount] = useState(20);
  const [initialWordCount, setInitialWordCount] = useState(0);

  const [shuffledWords, setShuffledWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  
  const [skippedWords, setSkippedWords] = useState([]);
  const [isShowingAnswer, setIsShowingAnswer] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);
  
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalTypedChars, setTotalTypedChars] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const historyRef = collection(db, 'playHistory');
    
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp - a.timestamp); 
      setHistories(data);
    }, (error) => {
      console.error("History fetch error", error);
    });
    return () => unsubscribe();
  }, [user]);

  const uniquePlayersFromDB = Array.from(new Set(histories.map(h => h.playerName))).filter(Boolean);
  const combinedPlayerNames = Array.from(new Set([...localPlayerNames, ...uniquePlayersFromDB])).sort();

  const filteredHistories = selectedPlayerFilter === 'all' 
    ? histories 
    : histories.filter(h => h.playerName === selectedPlayerFilter);

  const getAccuracy = useCallback(() => {
    const total = totalTypedChars + missCount;
    return total === 0 ? 0 : Math.round((totalTypedChars / total) * 100);
  }, [totalTypedChars, missCount]);

  const getPlayerTotalXP = (name) => {
    return histories
      .filter(h => h.playerName === name)
      .reduce((sum, h) => sum + (h.earnedXP || 0), 0);
  };

  useEffect(() => {
    if (gameState === 'result' && !hasSaved) {
      const saveHistory = async () => {
        if (!user || !db) return;
        try {
          const currentAccuracy = getAccuracy();
          const xp = calculateEarnedXP(initialWordCount, timeElapsed, currentAccuracy, skipCount);
          
          const historyRef = collection(db, 'playHistory');
          await addDoc(historyRef, {
            playerName: playerName.trim() || '名無し',
            timestamp: Date.now(),
            startCategory,
            endCategory,
            questionCount: initialWordCount,
            timeElapsed,
            accuracy: currentAccuracy,
            missCount,
            skipCount,
            earnedXP: xp,
            uid: user.uid
          });
        } catch (e) {
          console.error("History save error: ", e);
        }
      };
      saveHistory();
      setHasSaved(true);
    }
  }, [gameState, hasSaved, user, getAccuracy, playerName, startCategory, endCategory, initialWordCount, timeElapsed, missCount, skipCount]);


  const playWordAudio = useCallback((wordText) => {
    if (!isTTSEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wordText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; 
    window.speechSynthesis.speak(utterance);
  }, [isTTSEnabled]);


  const handleStartCategoryChange = (e) => {
    const newStart = Number(e.target.value);
    setStartCategory(newStart);
    if (endCategory < newStart) {
      setEndCategory(newStart);
    }
  };

  const startGame = () => {
    const filteredWords = WORD_DATA.filter(w => w.cat >= startCategory && w.cat <= endCategory);
    if (filteredWords.length === 0) {
      alert("選択した範囲に単語がありません。");
      return;
    }

    const trimmedName = playerName.trim();
    if (trimmedName) {
      localStorage.setItem('typingQuiz_playerName', trimmedName);
      setLocalPlayerNames(prev => {
        const newNames = Array.from(new Set([trimmedName, ...prev])).slice(0, 10);
        localStorage.setItem('typingQuiz_localPlayerNames', JSON.stringify(newNames));
        return newNames;
      });
    }

    const shuffledAll = [...filteredWords];
    for (let i = shuffledAll.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledAll[i], shuffledAll[j]] = [shuffledAll[j], shuffledAll[i]];
    }

    const shuffled = shuffledAll.slice(0, Math.min(questionCount, filteredWords.length));
    
    setStartTotalXP(getPlayerTotalXP(trimmedName));

    setShuffledWords(shuffled);
    setCurrentWordIndex(0);
    setTypedText(shuffled[0].en.charAt(0));
    setInitialWordCount(shuffled.length); 
    
    setSkippedWords([]);
    setIsShowingAnswer(false);
    setIsRetryMode(false);
    setTotalTypedChars(0);
    setMissCount(0);
    setSkipCount(0);
    setHasSaved(false);
    setStartTime(Date.now());
    setTimeElapsed(0);
    setGameState('playing');

    playWordAudio(shuffled[0].en);
  };

  const goToNext = useCallback(() => {
    setIsShowingAnswer(false);
    if (currentWordIndex + 1 < shuffledWords.length) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      setTypedText(shuffledWords[nextIndex].en.charAt(0));
      playWordAudio(shuffledWords[nextIndex].en);
    } else {
      if (skippedWords.length > 0) {
        setShuffledWords([...skippedWords]);
        setCurrentWordIndex(0);
        setTypedText(skippedWords[0].en.charAt(0));
        playWordAudio(skippedWords[0].en);
        setSkippedWords([]); 
        setIsRetryMode(true);
      } else {
        setGameState('result');
      }
    }
  }, [currentWordIndex, shuffledWords, skippedWords, playWordAudio]);

  const handleSkip = useCallback(() => {
    if (isShowingAnswer || gameState !== 'playing') return;
    setSkippedWords(prev => [...prev, shuffledWords[currentWordIndex]]);
    setSkipCount(prev => prev + 1);
    setIsShowingAnswer(true);
    playWordAudio(shuffledWords[currentWordIndex].en);
  }, [isShowingAnswer, gameState, shuffledWords, currentWordIndex, playWordAudio]);

  useEffect(() => {
    if (gameState !== 'playing' || showGiveUpModal) return;

    const handleKeyDown = (e) => {
      if (isShowingAnswer) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToNext();
        }
        return; 
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
        return;
      }

      if (e.key.length !== 1 || !/[a-zA-Z\s-]/.test(e.key)) return;
      e.preventDefault(); 

      const currentWord = shuffledWords[currentWordIndex].en;
      const expectedChar = currentWord[typedText.length];

      if (e.key.toLowerCase() === expectedChar.toLowerCase()) {
        const newTypedText = typedText + currentWord[typedText.length]; 
        setTypedText(newTypedText);
        setTotalTypedChars(prev => prev + 1);

        if (newTypedText.length === currentWord.length) {
          setTimeout(() => {
            goToNext();
          }, 150);
        }
      } else {
        setMissCount(prev => prev + 1); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentWordIndex, typedText, shuffledWords, isShowingAnswer, goToNext, handleSkip, showGiveUpModal]);

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && !isShowingAnswer && !showGiveUpModal) {
      timer = setInterval(() => {
        setTimeElapsed(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [gameState, startTime, isShowingAnswer, showGiveUpModal]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const executeDelete = async () => {
    if (!deleteTarget || !db || !user) return;
    
    const getDocRef = (id) => doc(db, 'playHistory', id);
    
    try {
      if (deleteTarget.type === 'single') {
        await deleteDoc(getDocRef(deleteTarget.id));
      } else if (deleteTarget.type === 'all') {
        const promises = filteredHistories.map(h => deleteDoc(getDocRef(h.id)));
        await Promise.all(promises);
      }
    } catch (e) {
      console.error("Delete history error:", e);
    }
    setDeleteTarget(null);
  };


  // --- UI レンダリング ---
  const renderStartScreen = () => {
    const availableWordsCount = WORD_DATA.filter(w => w.cat >= startCategory && w.cat <= endCategory).length;
    const canStart = availableWordsCount > 0 && playerName.trim() !== '';
    
    return (
      <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500 py-10 w-full max-w-md">
        <div className="w-full flex justify-end">
           <button 
             onClick={() => setGameState('history')}
             className="flex items-center space-x-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold transition-colors active:scale-95"
           >
             <History className="w-5 h-5" />
             <span>学習履歴・称号</span>
           </button>
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-5 bg-indigo-100 rounded-full mb-2">
            <Keyboard className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">英単語タイピング</h1>
          <p className="text-gray-500 font-medium">早くクリアしてポイントを稼ごう！</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full space-y-6">
          
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4" />
              <span>なまえ（生徒名）</span>
            </label>
            <input 
              type="text" 
              list="player-names"
              value={playerName}
              onChange={handlePlayerNameChange}
              placeholder="リストから選ぶか、新しい名前を入力"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition-colors font-bold"
            />
            <datalist id="player-names">
              {combinedPlayerNames.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {localPlayerNames.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {localPlayerNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setPlayerName(name)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${playerName === name ? 'bg-indigo-500 text-white shadow-sm' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2 text-gray-700 font-bold">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span>出題範囲</span>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ここから</label>
              <select 
                value={startCategory}
                onChange={handleStartCategoryChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm md:text-base rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition-colors font-medium"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="text-center text-slate-400">▼</div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ここまで</label>
              <select 
                value={endCategory}
                onChange={(e) => setEndCategory(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm md:text-base rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition-colors font-medium"
              >
                {CATEGORIES.filter(cat => cat.id >= startCategory).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <p className="text-sm text-indigo-600 font-semibold text-right">
              対象単語: {availableWordsCount}語
            </p>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
              <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
                {isTTSEnabled ? <Volume2 className="w-5 h-5 text-indigo-500" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                <span>英単語の読み上げ</span>
              </div>
              <button 
                onClick={toggleTTS}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTTSEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTTSEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">問題数</label>
            <select 
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition-colors"
            >
              <option value={10}>10問（サクッと復習）</option>
              <option value={20}>20問（しっかり練習）</option>
              <option value={30}>30問（テスト対策）</option>
              <option value={999}>全問（限界に挑戦！）</option>
            </select>
          </div>

          <button
            onClick={startGame}
            disabled={!canStart}
            className={`w-full flex items-center justify-center space-x-3 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 ${!canStart ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-200'}`}
          >
            <Play className="w-6 h-6 fill-current" />
            <span className="text-xl">スタート</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPlayingScreen = () => {
    if (shuffledWords.length === 0) return null;
    const currentWord = shuffledWords[currentWordIndex];
    const typed = currentWord.en.substring(0, typedText.length);
    const remaining = currentWord.en.substring(typedText.length);
    const visiblePart = typed;
    const hiddenPart = remaining.replace(/[a-zA-Z]/g, '_');

    return (
      <div className="flex flex-col items-center justify-center space-y-10 w-full max-w-3xl animate-in fade-in duration-300">
        
        {showGiveUpModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <LogOut className="text-red-500 w-6 h-6" />
                <span>プレイ中断</span>
              </h3>
              <p className="text-slate-600 mb-8 font-medium">
                プレイを中断してトップに戻りますか？<br/>※今回の記録やXPは保存されません。
              </p>
              <div className="flex space-x-3 justify-end">
                <button 
                  onClick={() => setShowGiveUpModal(false)}
                  className="px-5 py-3 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >キャンセル</button>
                <button 
                  onClick={() => {
                    setShowGiveUpModal(false);
                    setGameState('start');
                    window.speechSynthesis.cancel();
                  }}
                  className="px-5 py-3 text-white bg-red-500 hover:bg-red-600 rounded-xl font-bold shadow-lg shadow-red-200 transition-colors"
                >ギブアップ</button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 text-slate-600 font-bold text-lg">
            <Target className="w-6 h-6 text-indigo-500" />
            <span>
              {isRetryMode && <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs rounded-md mr-2 align-middle">再挑戦</span>}
              {currentWordIndex + 1} / {shuffledWords.length}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-slate-600 font-mono text-xl font-bold">
            <Clock className="w-6 h-6 text-indigo-500" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-sm border border-gray-100 min-h-[350px] relative">
          
          <div className="absolute top-6 right-6">
            <button 
              onClick={() => setShowGiveUpModal(true)}
              className="px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors active:scale-95 flex items-center space-x-2 border border-transparent hover:border-red-100"
              title="プレイを中断する"
            >
              <LogOut className="w-4 h-4" />
              <span>ギブアップ</span>
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-10 mt-4 md:mt-0">
            <p className="text-2xl md:text-3xl font-bold text-slate-700 tracking-wide text-center">
              {currentWord.ja}
            </p>
            {isTTSEnabled && (
              <button 
                onClick={() => playWordAudio(currentWord.en)}
                className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-full transition-colors active:scale-90 focus:outline-none"
                title="発音を聴く"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            )}
          </div>
          
          {isShowingAnswer ? (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
              <p className="text-sm font-bold text-pink-500 mb-2 uppercase tracking-widest">Answer</p>
              <div className="text-4xl md:text-6xl font-mono tracking-[0.2em] px-4 text-center whitespace-pre-wrap break-all text-indigo-600 mb-8 font-bold">
                {currentWord.en}
              </div>
              <button 
                onClick={goToNext}
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold py-3 px-8 rounded-xl transition-colors flex items-center space-x-2 active:scale-95"
              >
                <span>次へ進む (Enter)</span>
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className="text-4xl md:text-6xl font-mono tracking-[0.2em] relative px-4 text-center whitespace-pre-wrap break-all mb-4">
                <span className="text-indigo-600">{visiblePart}</span>
                <span className="text-slate-300">{hiddenPart}</span>
              </div>
              
              <div className="absolute bottom-6 flex justify-center w-full">
                <button 
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-slate-600 font-semibold text-sm flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>スキップして答えを見る (Esc)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full bg-slate-200 rounded-full h-3">
          <div 
            className="bg-indigo-500 h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
            style={{ width: `${((currentWordIndex) / shuffledWords.length) * 100}%` }}
          >
            <div className="absolute inset-0 bg-white/20"></div>
          </div>
        </div>
      </div>
    );
  };

  const renderResultScreen = () => {
    const accuracy = getAccuracy();
    const currentEarnedXP = calculateEarnedXP(initialWordCount, timeElapsed, accuracy, skipCount);
    
    const startStatus = getPlayerStatus(startTotalXP);
    const finalTotalXP = startTotalXP + currentEarnedXP;
    const finalStatus = getPlayerStatus(finalTotalXP);
    const isLevelUp = startStatus.currentLevel.level < finalStatus.currentLevel.level;
    
    const currentLevelMinXP = finalStatus.currentLevel.minXP;
    const nextLevelMinXP = finalStatus.nextLevel ? finalStatus.nextLevel.minXP : currentLevelMinXP + 1000;
    const xpInCurrentLevel = finalTotalXP - currentLevelMinXP;
    const xpNeededForNext = nextLevelMinXP - currentLevelMinXP;
    const progressPercent = finalStatus.nextLevel ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100)) : 100;

    return (
      <div className="flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-4xl py-10">
        
        {isLevelUp && (
          <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-700 delay-300 text-center mb-4">
            <span className="inline-flex items-center space-x-2 bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-black text-xl shadow-lg shadow-yellow-200 tracking-widest">
              <ChevronUp className="w-6 h-6" />
              <span>LEVEL UP!</span>
              <ChevronUp className="w-6 h-6" />
            </span>
            <p className="mt-3 text-lg font-bold text-slate-700">新たな称号 <span className={`mx-1 px-2 py-1 rounded ${finalStatus.currentLevel.bg} ${finalStatus.currentLevel.color}`}> {finalStatus.currentLevel.title} </span> を獲得しました！</p>
          </div>
        )}

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-6 bg-indigo-100 rounded-full mb-2">
            <Trophy className="w-20 h-20 text-indigo-500" />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-800">全問クリア！</h2>
          
          <div className="mt-4 inline-flex items-center space-x-3 bg-yellow-50 px-8 py-4 rounded-2xl border-2 border-yellow-200">
            <Star className="w-8 h-8 text-yellow-500 fill-current animate-pulse" />
            <div className="text-left">
              <p className="text-sm font-bold text-yellow-700 leading-none mb-1">獲得ポイント (XP)</p>
              <p className="text-3xl font-black text-yellow-600 leading-none">+{currentEarnedXP} <span className="text-lg">pt</span></p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center space-x-2">
              <Award className={`w-6 h-6 ${finalStatus.currentLevel.color}`} />
              <span className="font-bold text-slate-500">Lv.{finalStatus.currentLevel.level}</span>
              <span className={`font-black text-lg ${finalStatus.currentLevel.color}`}>{finalStatus.currentLevel.title}</span>
            </div>
            {finalStatus.nextLevel && (
              <span className="text-sm font-bold text-slate-400">Next: Lv.{finalStatus.nextLevel.level}</span>
            )}
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden relative">
            <div 
              className="bg-indigo-500 h-4 rounded-full transition-all duration-1000 ease-out absolute left-0 top-0" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>累計: {finalTotalXP} pt</span>
            {finalStatus.nextLevel ? (
              <span>あと {finalStatus.nextLevel.minXP - finalTotalXP} pt</span>
            ) : (
              <span>最高レベル到達！</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-3">
            <span className="text-slate-500 font-bold text-sm">クリアタイム</span>
            <span className="text-2xl md:text-3xl font-mono font-bold text-slate-800">{formatTime(timeElapsed)}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-3">
            <span className="text-slate-500 font-bold text-sm">正確率</span>
            <span className="text-2xl md:text-3xl font-mono font-bold text-indigo-600">{accuracy}%</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-3">
            <span className="text-slate-500 font-bold text-sm">ミスタイプ</span>
            <span className="text-2xl md:text-3xl font-mono font-bold text-pink-500">{missCount}回</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-3">
            <span className="text-slate-500 font-bold text-sm">スキップ回数</span>
            <span className="text-2xl md:text-3xl font-mono font-bold text-orange-500">{skipCount}回</span>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            onClick={() => setGameState('history')}
            className="flex items-center justify-center space-x-3 bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50 font-bold py-4 px-8 rounded-2xl transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <History className="w-6 h-6" />
            <span className="text-lg">学習履歴を見る</span>
          </button>

          <button
            onClick={() => setGameState('start')}
            className="flex items-center justify-center space-x-3 bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-lg">トップに戻る</span>
          </button>
        </div>
      </div>
    );
  };

  const renderHistoryScreen = () => {
    const filteredHistories = selectedPlayerFilter === 'all' 
      ? histories 
      : histories.filter(h => h.playerName === selectedPlayerFilter);

    let dashBoard = null;
    if (selectedPlayerFilter !== 'all') {
      const totalXP = getPlayerTotalXP(selectedPlayerFilter);
      const status = getPlayerStatus(totalXP);
      
      const currentLevelMinXP = status.currentLevel.minXP;
      const nextLevelMinXP = status.nextLevel ? status.nextLevel.minXP : currentLevelMinXP + 1000;
      const xpInCurrentLevel = totalXP - currentLevelMinXP;
      const xpNeededForNext = nextLevelMinXP - currentLevelMinXP;
      const progressPercent = status.nextLevel ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100)) : 100;

      dashBoard = (
        <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${status.currentLevel.bg}`}>
              <Award className={`w-10 h-10 ${status.currentLevel.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">{selectedPlayerFilter} さんの現在のステータス</p>
              <div className="flex items-baseline space-x-3">
                <span className="text-xl font-black text-slate-700">Lv.{status.currentLevel.level}</span>
                <span className={`text-2xl font-black ${status.currentLevel.color}`}>{status.currentLevel.title}</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between items-end text-sm font-bold">
              <span className="text-slate-600 flex items-center space-x-1"><Star className="w-4 h-4 text-yellow-500 fill-current"/><span>累計 {totalXP} pt</span></span>
              {status.nextLevel && <span className="text-slate-400">次の称号まで {status.nextLevel.minXP - totalXP} pt</span>}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
              <div className="bg-indigo-500 h-3 rounded-full absolute left-0 top-0" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center w-full max-w-5xl py-10 animate-in fade-in duration-300">
        
        {deleteTarget && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <Trash2 className="text-red-500 w-6 h-6" />
                <span>履歴の削除</span>
              </h3>
              <p className="text-slate-600 mb-8 font-medium">
                {deleteTarget.type === 'all' 
                  ? `${deleteTarget.playerName} さんの履歴をすべて削除します。よろしいですか？この操作は取り消せません。`
                  : 'このプレイ履歴を削除します。よろしいですか？'}
              </p>
              <div className="flex space-x-3 justify-end">
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-3 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >キャンセル</button>
                <button 
                  onClick={executeDelete}
                  className="px-5 py-3 text-white bg-red-500 hover:bg-red-600 rounded-xl font-bold shadow-lg shadow-red-200 transition-colors"
                >削除する</button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-between mb-8">
          <button 
            onClick={() => setGameState('start')}
            className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>トップに戻る</span>
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 flex items-center space-x-3">
            <History className="w-8 h-8 text-indigo-500" />
            <span>学習履歴</span>
          </h2>
          <div className="w-32 hidden md:block"></div>
        </div>

        <div className="w-full mb-6 flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-slate-600 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>生徒で絞り込み:</span>
            </span>
            <select 
              value={selectedPlayerFilter}
              onChange={(e) => setSelectedPlayerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-2 px-4 outline-none font-bold"
            >
              <option value="all">すべての生徒を表示</option>
              {combinedPlayerNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {selectedPlayerFilter !== 'all' && filteredHistories.length > 0 && (
            <button 
              onClick={() => setDeleteTarget({ type: 'all', playerName: selectedPlayerFilter })}
              className="flex items-center space-x-2 text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl font-bold transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>この生徒の履歴を全クリア</span>
            </button>
          )}
        </div>

        {dashBoard}

        <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredHistories.length === 0 ? (
            <div className="py-20 text-center text-slate-500 font-medium">
              まだ学習履歴がありません。<br />プレイして記録を残しましょう！
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                    <th className="p-4 font-bold whitespace-nowrap">なまえ</th>
                    <th className="p-4 font-bold whitespace-nowrap">プレイ日時</th>
                    <th className="p-4 font-bold">出題範囲</th>
                    <th className="p-4 font-bold text-center">問題数</th>
                    <th className="p-4 font-bold text-center">獲得XP</th>
                    <th className="p-4 font-bold text-center">正確率</th>
                    <th className="p-4 font-bold text-center">タイム</th>
                    <th className="p-4 font-bold text-center">スキップ</th>
                    <th className="p-4 font-bold text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistories.map(h => (
                    <tr key={h.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 text-base font-bold text-indigo-700 whitespace-nowrap">{h.playerName}</td>
                      <td className="p-4 text-sm font-medium text-slate-500 whitespace-nowrap">{formatDate(h.timestamp)}</td>
                      <td className="p-4 text-sm text-slate-600 min-w-[150px]">
                        {getCategoryName(h.startCategory)} <br className="md:hidden" /><span className="text-slate-400 mx-1 md:inline hidden">〜</span> {getCategoryName(h.endCategory)}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-700">{h.questionCount}</td>
                      <td className="p-4 text-center font-mono font-bold text-yellow-600">+{h.earnedXP || 0}</td>
                      <td className="p-4 text-center font-mono font-bold text-indigo-600">{h.accuracy}%</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-700">{formatTime(h.timeElapsed)}</td>
                      <td className="p-4 text-center font-mono font-bold text-orange-500">{h.skipCount}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setDeleteTarget({ type: 'single', id: h.id })}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="この履歴を削除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans selection:bg-indigo-100">
      {gameState === 'start' && renderStartScreen()}
      {gameState === 'playing' && renderPlayingScreen()}
      {gameState === 'result' && renderResultScreen()}
      {gameState === 'history' && renderHistoryScreen()}
    </div>
  );
}
