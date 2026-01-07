import { AppHeader } from "@/src/components/AppHeader";
import quizData from "@/src/data/quizQuestions.json";
import { useStore } from "@/src/store/useStore";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function GameScreen() {
  const { logout, user } = useStore();
  const [activeTab, setActiveTab] = useState<"quiz" | "leaderboard">("quiz");
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>(
    []
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<QuizResult["answers"]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timerAnimation] = useState(new Animated.Value(1));
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showMyRewardsModal, setShowMyRewardsModal] = useState(false);
  const [userPoints, setUserPoints] = useState(850); // Mock user points
  const [claimedRewards, setClaimedRewards] = useState<Reward[]>([
    // Mock claimed rewards
    { id: "2", name: "Perpanjangan SIM C gratis", points: 300, icon: "card-outline" },
  ]);
  
  // Rewards data
  const rewards: Reward[] = [
    { id: "1", name: "Pembuatan SIM C gratis", points: 500, icon: "card" },
    { id: "2", name: "Perpanjangan SIM C gratis", points: 300, icon: "card-outline" },
    { id: "3", name: "Pembuatan SIM A gratis", points: 1000, icon: "card" },
    { id: "4", name: "Perpanjangan SIM A gratis", points: 600, icon: "card-outline" },
    { id: "5", name: "Perpanjangan TNKB gratis", points: 700, icon: "pricetag" },
  ];
  
  // Leaderboard state (mock data - should come from backend)
  // Include current user in leaderboard
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { id: "1", name: "Ahmad Wijaya", score: 950, correctAnswers: 5, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
    { id: "2", name: user?.name || "Guest", score: 820, correctAnswers: 4, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
    { id: "3", name: "Budi Santoso", score: 800, correctAnswers: 4, totalQuestions: 5, date: "2026-01-07", rewardClaimed: true },
    { id: "4", name: "Citra Dewi", score: 750, correctAnswers: 4, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
    { id: "5", name: "Diana Putri", score: 700, correctAnswers: 3, totalQuestions: 5, date: "2026-01-07", rewardClaimed: false },
  ]);

  // Get 5 random questions
  const getRandomQuestions = () => {
    const shuffled = [...quizData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5) as QuizQuestion[];
  };

  // Start game
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

  // Timer effect
  useEffect(() => {
    if (!gameStarted || showResult) return;

    // Animate timer
    Animated.timing(timerAnimation, {
      toValue: 0,
      duration: 10000,
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(null); // Auto submit when time runs out
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

  // Calculate score based on time (faster = higher score)
  const calculateScore = (timeSpent: number): number => {
    const baseScore = 100;
    const timeBonus = (10 - timeSpent) * 10; // Max 100 bonus points
    return baseScore + timeBonus;
  };

  // Handle answer selection
  const handleAnswer = (answer: string | null) => {
    if (selectedAnswer !== null) return; // Already answered

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    const timeSpent = 10 - timeLeft;
    const isCorrect = answer === currentQuestion.correctAnswer;
    const questionScore = isCorrect ? calculateScore(timeSpent) : 0;

    // Save answer
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

    // Move to next question or show result
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

  // Render start screen
  const renderStartScreen = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="trophy" size={80} color={COLORS.PRIMARY} />
      <Text style={styles.title}>Kuis AI</Text>
      <Text style={styles.subtitle}>
        Uji pengetahuan Anda tentang lalu lintas!
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="help-circle" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.infoText}>5 pertanyaan random</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.infoText}>10 detik per pertanyaan</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="flash" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.infoText}>Makin cepat, makin besar nilai!</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>Mulai Kuis</Text>
        <Ionicons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Render question
  const renderQuestion = () => {
    const question = selectedQuestions[currentQuestionIndex];
    const progress =
      ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;

    return (
      <View style={styles.questionContainer}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.questionNumber}>
          Pertanyaan {currentQuestionIndex + 1} dari {selectedQuestions.length}
        </Text>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Ionicons
            name="time"
            size={24}
            color={timeLeft <= 3 ? "#FF3B30" : COLORS.PRIMARY}
          />
          <Text
            style={[styles.timerText, timeLeft <= 3 && styles.timerTextDanger]}
          >
            {timeLeft}s
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option) => {
            let optionStyle = styles.optionButton;
            let optionTextStyle = styles.optionText;

            if (selectedAnswer !== null) {
              if (option.key === question.correctAnswer) {
                optionStyle = styles.optionButtonCorrect;
                optionTextStyle = styles.optionTextCorrect;
              } else if (option.key === selectedAnswer) {
                optionStyle = styles.optionButtonWrong;
                optionTextStyle = styles.optionTextWrong;
              }
            }

            return (
              <TouchableOpacity
                key={option.key}
                style={optionStyle}
                onPress={() => handleAnswer(option.key)}
                disabled={selectedAnswer !== null}
              >
                <View style={styles.optionKeyContainer}>
                  <Text style={styles.optionKey}>{option.key}</Text>
                </View>
                <Text style={optionTextStyle}>{option.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show explanation after answer */}
        {selectedAnswer !== null && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render result screen
  const renderResult = () => {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const percentage = (correctCount / selectedQuestions.length) * 100;

    let resultEmoji = "😢";
    let resultText = "Perlu Belajar Lagi";
    let resultColor = "#FF3B30";

    if (percentage >= 80) {
      resultEmoji = "🎉";
      resultText = "Luar Biasa!";
      resultColor = "#34C759";
    } else if (percentage >= 60) {
      resultEmoji = "😊";
      resultText = "Bagus!";
      resultColor = "#007AFF";
    } else if (percentage >= 40) {
      resultEmoji = "😐";
      resultText = "Cukup Baik";
      resultColor = "#FF9500";
    }

    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultEmoji}>{resultEmoji}</Text>
          <Text style={[styles.resultTitle, { color: resultColor }]}>
            {resultText}
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Total Skor</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreDetail}>
              {correctCount} dari {selectedQuestions.length} benar
            </Text>
          </View>
        </View>

        {/* Answer summary - Scrollable */}
        <ScrollView
          style={styles.summaryScrollView}
          contentContainerStyle={styles.summaryContentContainer}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.summaryTitle}>Ringkasan Jawaban:</Text>
          {answers.map((answer, index) => (
            <View key={index} style={styles.summaryItem}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryQuestion}>
                  {index + 1}. {answer.question.substring(0, 50)}...
                </Text>
                {answer.isCorrect ? (
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                ) : (
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                )}
              </View>
              <View style={styles.summaryDetails}>
                <Text style={styles.summaryText}>
                  Waktu: {answer.timeSpent}s • Skor: {answer.score}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Fixed button at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.playAgainButton} onPress={startGame}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.playAgainButtonText}>Main Lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render leaderboard
  const renderLeaderboard = () => {
    const currentUserRank = leaderboard.findIndex(entry => entry.name === user?.name) + 1;
    const canClaimReward = currentUserRank > 0 && currentUserRank <= 3;

    const handleOpenRewardsModal = () => {
      setShowRewardsModal(true);
    };

    const handleClaimRewardItem = (reward: Reward) => {
      if (userPoints >= reward.points) {
        Alert.alert(
          "Claim Reward",
          `Yakin ingin claim "${reward.name}" dengan ${reward.points} poin?`,
          [
            { text: "Batal", style: "cancel" },
            {
              text: "Claim",
              onPress: () => {
                setUserPoints(prev => prev - reward.points);
                setClaimedRewards(prev => [...prev, reward]);
                Alert.alert("Berhasil!", `${reward.name} berhasil di-claim!`);
                setShowRewardsModal(false);
                // TODO: Implement actual reward claim logic with backend
              },
            },
          ]
        );
      }
    };

    return (
      <View style={styles.leaderboardContainer}>
        <View style={styles.leaderboardHeader}>
          <Ionicons name="trophy" size={32} color="#FFD700" />
          <Text style={styles.leaderboardTitle}>Papan Peringkat</Text>
          <Text style={styles.leaderboardSubtitle}>Top performers hari ini</Text>
          
          <View style={styles.rewardButtonsContainer}>
            {canClaimReward && (
              <TouchableOpacity
                style={styles.claimRewardButton}
                onPress={handleOpenRewardsModal}
              >
                <Ionicons name="gift" size={20} color="white" />
                <Text style={styles.claimRewardButtonText}>Claim Reward</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.myRewardButton}
              onPress={() => setShowMyRewardsModal(true)}
            >
              <Ionicons name="ribbon" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.myRewardButtonText}>My Reward</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.leaderboardList}
          contentContainerStyle={styles.leaderboardContent}
          showsVerticalScrollIndicator={true}
        >
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.name === user?.name;
            const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
            const medalColor = medalColors[index] || COLORS.PRIMARY;
            
            return (
              <View 
                key={entry.id} 
                style={[
                  styles.leaderboardItem,
                  isCurrentUser && styles.leaderboardItemHighlight
                ]}
              >
                <View style={styles.leaderboardRank}>
                  {index < 3 ? (
                    <Ionicons name="medal" size={28} color={medalColor} />
                  ) : (
                    <Text style={styles.leaderboardRankText}>{index + 1}</Text>
                  )}
                </View>

                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>
                    {entry.name}
                    {isCurrentUser && " (Anda)"}
                  </Text>
                  <Text style={styles.leaderboardStats}>
                    {entry.correctAnswers}/{entry.totalQuestions} benar • {new Date(entry.date).toLocaleDateString("id-ID")}
                  </Text>
                </View>

                <View style={styles.leaderboardRight}>
                  <Text style={styles.leaderboardScore}>{entry.score}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Rewards Modal */}
        <Modal
          visible={showRewardsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRewardsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons name="gift" size={24} color={COLORS.PRIMARY} />
                  <Text style={styles.modalTitle}>Pilih Reward</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowRewardsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.pointsContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.pointsText}>Poin Anda: {userPoints}</Text>
              </View>

              <ScrollView style={styles.rewardsList} showsVerticalScrollIndicator={true}>
                {rewards.map((reward) => {
                  const canClaim = userPoints >= reward.points;
                  
                  return (
                    <TouchableOpacity
                      key={reward.id}
                      style={[
                        styles.rewardItem,
                        !canClaim && styles.rewardItemDisabled,
                      ]}
                      onPress={() => handleClaimRewardItem(reward)}
                      disabled={!canClaim}
                      activeOpacity={0.7}
                    >
                      <View style={styles.rewardIcon}>
                        <Ionicons 
                          name={reward.icon as any} 
                          size={28} 
                          color={canClaim ? COLORS.PRIMARY : "#D1D5DB"} 
                        />
                      </View>

                      <View style={styles.rewardInfo}>
                        <Text style={[
                          styles.rewardName,
                          !canClaim && styles.rewardNameDisabled,
                        ]}>
                          {reward.name}
                        </Text>
                        <View style={styles.rewardPoints}>
                          <Ionicons 
                            name="star" 
                            size={14} 
                            color={canClaim ? "#FFD700" : "#D1D5DB"} 
                          />
                          <Text style={[
                            styles.rewardPointsText,
                            !canClaim && styles.rewardPointsTextDisabled,
                          ]}>
                            {reward.points} poin
                          </Text>
                        </View>
                      </View>

                      {canClaim ? (
                        <Ionicons name="chevron-forward" size={20} color={COLORS.PRIMARY} />
                      ) : (
                        <View style={styles.lockedBadge}>
                          <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* My Rewards Modal */}
        <Modal
          visible={showMyRewardsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMyRewardsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons name="ribbon" size={24} color={COLORS.PRIMARY} />
                  <Text style={styles.modalTitle}>My Reward</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowMyRewardsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {claimedRewards.length > 0 ? (
                <ScrollView style={styles.rewardsList} showsVerticalScrollIndicator={true}>
                  {claimedRewards.map((reward) => (
                    <View key={reward.id} style={styles.myRewardItem}>
                      <View style={styles.myRewardIcon}>
                        <Ionicons 
                          name={reward.icon as any} 
                          size={28} 
                          color={COLORS.PRIMARY} 
                        />
                      </View>

                      <View style={styles.rewardInfo}>
                        <Text style={styles.rewardName}>
                          {reward.name}
                        </Text>
                        <View style={styles.rewardPoints}>
                          <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                          <Text style={styles.myRewardClaimedText}>
                            Telah diklaim
                          </Text>
                        </View>
                      </View>

                      <View style={styles.myRewardBadge}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.myRewardPoints}>{reward.points}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyMyRewards}>
                  <Ionicons name="ribbon-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyMyRewardsTitle}>Belum ada reward</Text>
                  <Text style={styles.emptyMyRewardsText}>
                    Claim reward dari quiz untuk melihatnya di sini
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader
        onLogout={() => {
          logout();
          router.replace("/login");
        }}
      />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "quiz" && styles.tabActive]}
          onPress={() => setActiveTab("quiz")}
        >
          <Ionicons 
            name="game-controller" 
            size={20} 
            color={activeTab === "quiz" ? COLORS.PRIMARY : "#6B7280"} 
          />
          <Text style={[styles.tabText, activeTab === "quiz" && styles.tabTextActive]}>
            Kuis Harian
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "leaderboard" && styles.tabActive]}
          onPress={() => setActiveTab("leaderboard")}
        >
          <Ionicons 
            name="trophy" 
            size={20} 
            color={activeTab === "leaderboard" ? COLORS.PRIMARY : "#6B7280"} 
          />
          <Text style={[styles.tabText, activeTab === "leaderboard" && styles.tabTextActive]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "quiz" ? (
        !gameStarted
          ? renderStartScreen()
          : showResult
          ? renderResult()
          : renderQuestion()
      ) : (
        renderLeaderboard()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: COLORS.PRIMARY,
  },
  leaderboardContainer: {
    flex: 1,
  },
  leaderboardHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 8,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  rewardButtonsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  claimRewardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34C759",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  claimRewardButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  myRewardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myRewardButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  leaderboardList: {
    flex: 1,
  },
  leaderboardContent: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leaderboardItemHighlight: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 3,
    backgroundColor: "#E0EFFF",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  leaderboardRankText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  leaderboardStats: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  leaderboardRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  leaderboardScore: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "500",
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  questionNumber: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    textAlign: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  timerTextDanger: {
    color: "#FF3B30",
  },
  questionCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  questionText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    gap: 12,
  },
  optionButtonCorrect: {
    flexDirection: "row",
    backgroundColor: "#E5F7ED",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#34C759",
    gap: 12,
  },
  optionButtonWrong: {
    flexDirection: "row",
    backgroundColor: "#FFE5E5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF3B30",
    gap: 12,
  },
  optionKeyContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  optionKey: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  optionTextCorrect: {
    flex: 1,
    fontSize: 16,
    color: "#34C759",
    fontWeight: "600",
  },
  optionTextWrong: {
    flex: 1,
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
  explanationCard: {
    backgroundColor: "#E5F7ED",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  resultEmoji: {
    fontSize: 64,
    textAlign: "center",
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  scoreDetail: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryScrollView: {
    flex: 1,
  },
  summaryContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    marginTop: 8,
  },
  summaryItem: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  summaryQuestion: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "500",
    marginRight: 8,
  },
  summaryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  playAgainButton: {
    flexDirection: "row",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  playAgainButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
  },
  rewardsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  rewardItemDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    opacity: 0.6,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardInfo: {
    flex: 1,
    gap: 4,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  rewardNameDisabled: {
    color: "#9CA3AF",
  },
  rewardPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardPointsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  rewardPointsTextDisabled: {
    color: "#9CA3AF",
  },
  lockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  myRewardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
    gap: 12,
  },
  myRewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  myRewardClaimedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#34C759",
  },
  myRewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  myRewardPoints: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  emptyMyRewards: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyMyRewardsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMyRewardsText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
