import quizData from "@/src/data/quizQuestions.json";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

export default function GameScreen() {
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {!gameStarted
        ? renderStartScreen()
        : showResult
        ? renderResult()
        : renderQuestion()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
});
