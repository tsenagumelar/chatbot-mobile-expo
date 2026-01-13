import quizData from "@/src/data/quizQuestions.json";
import { useStore } from "@/src/store/useStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Alert } from "react-native";

interface QuizQuestion {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    score: number;
  }[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  date: string;
  rewardClaimed: boolean;
}

interface Reward {
  id: string;
  name: string;
  points: number;
  icon: string;
}

export default function useQuizScreen() {
  const { logout, user } = useStore();
  const [activeTab, setActiveTab] = useState<"quiz" | "leaderboard">("quiz");
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<QuizResult["answers"]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timerAnimation] = useState(new Animated.Value(1));
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showMyRewardsModal, setShowMyRewardsModal] = useState(false);
  const [userPoints, setUserPoints] = useState(850);
  const [claimedRewards, setClaimedRewards] = useState<Reward[]>([
    { id: "2", name: "Perpanjangan SIM C gratis", points: 300, icon: "card-outline" },
  ]);

  const rewards: Reward[] = [
    { id: "1", name: "Pembuatan SIM C gratis", points: 500, icon: "card" },
    { id: "2", name: "Perpanjangan SIM C gratis", points: 300, icon: "card-outline" },
    { id: "3", name: "Pembuatan SIM A gratis", points: 1000, icon: "card" },
    { id: "4", name: "Perpanjangan SIM A gratis", points: 600, icon: "card-outline" },
    { id: "5", name: "Perpanjangan TNKB gratis", points: 700, icon: "pricetag" },
  ];

  const [leaderboard] = useState<LeaderboardEntry[]>([
    { id: "1", name: "Ahmad Wijaya", score: 950, correctAnswers: 5, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
    { id: "2", name: user?.name || "Guest", score: 820, correctAnswers: 4, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
    { id: "3", name: "Budi Santoso", score: 800, correctAnswers: 4, totalQuestions: 5, date: "2026-01-07", rewardClaimed: true },
    { id: "4", name: "Citra Dewi", score: 750, correctAnswers: 4, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
    { id: "5", name: "Diana Putri", score: 700, correctAnswers: 3, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
  ]);

  const getRandomQuestions = () => {
    const shuffled = [...quizData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5) as QuizQuestion[];
  };

  const startGame = () => {
    const questions = getRandomQuestions();
    setSelectedQuestions(questions);
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
    setTimeLeft(10);
    setSelectedAnswer(null);
  };

  useEffect(() => {
    if (!gameStarted || showResult) return;

    Animated.timing(timerAnimation, {
      toValue: 0,
      duration: 10000,
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(null);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      timerAnimation.setValue(1);
    };
  }, [gameStarted, currentQuestionIndex, showResult]);

  const calculateScore = (timeSpent: number): number => {
    const baseScore = 100;
    const timeBonus = (10 - timeSpent) * 10;
    return baseScore + timeBonus;
  };

  const handleAnswer = (answer: string | null) => {
    if (selectedAnswer !== null) return;

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    const timeSpent = 10 - timeLeft;
    const isCorrect = answer === currentQuestion.correctAnswer;
    const questionScore = isCorrect ? calculateScore(timeSpent) : 0;

    const answerRecord = {
      question: currentQuestion.question,
      userAnswer: answer || "Tidak dijawab",
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent,
      score: questionScore,
    };

    setAnswers([...answers, answerRecord]);
    setSelectedAnswer(answer);

    if (isCorrect) {
      setScore(score + questionScore);
    }

    setTimeout(() => {
      if (currentQuestionIndex < selectedQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setTimeLeft(10);
        timerAnimation.setValue(1);
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  const handleFinishQuiz = () => {
    Alert.alert(
      "Keluar Quiz",
      "Yakin ingin keluar? Progress akan hilang.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: () => {
            setGameStarted(false);
            setSelectedAnswer(null);
            setSelectedQuestions([]);
            setCurrentQuestionIndex(0);
            setTimeLeft(10);
            setScore(0);
            setAnswers([]);
            setShowResult(false);
            timerAnimation.setValue(1);
          },
        },
      ]
    );
  };

  const claimReward = (reward: Reward) => {
    if (userPoints < reward.points) {
      Alert.alert("Poin Tidak Cukup", "Poin kamu belum cukup untuk klaim reward ini.");
      return;
    }
    setUserPoints((prev) => prev - reward.points);
    setClaimedRewards((prev) => [...prev, reward]);
    Alert.alert("Berhasil", `Reward "${reward.name}" berhasil diklaim!`);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return {
    user,
    activeTab,
    setActiveTab,
    gameStarted,
    currentQuestionIndex,
    selectedQuestions,
    selectedAnswer,
    timeLeft,
    score,
    answers,
    showResult,
    timerAnimation,
    showRewardsModal,
    setShowRewardsModal,
    showMyRewardsModal,
    setShowMyRewardsModal,
    userPoints,
    claimedRewards,
    rewards,
    leaderboard,
    startGame,
    handleAnswer,
    handleFinishQuiz,
    claimReward,
    handleLogout,
  };
}
