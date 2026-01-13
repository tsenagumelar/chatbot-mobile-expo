import { AppHeader } from "@/src/components/AppHeader";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useQuizScreen from "./hooks";

interface Reward {
  id: string;
  name: string;
  points: number;
  icon: string;
}

export default function GameScreen() {
  const {
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
    claimReward,
    handleLogout,
  } = useQuizScreen();

  const renderStartScreen = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="trophy" size={80} color={COLORS.PRIMARY} />
      <Text style={styles.title}>Kuis Harian Polantas Menyapa</Text>
      <Text style={styles.subtitle}>
        Membangun Budaya Tertib Berlalu Lintas dimulai dari Uji Pengetahuan Kamu
        Disini
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
          <Text style={styles.infoText}>Makin cepat, makin besar nilai poin!</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="gift" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.infoText}>
            Nilai poin kamu dapat ditukarkan menjadi berbagai reward seperti
            pembuatan SIM gratis, perpanjangan SIM gratis serta reward menarik
            lainnya dari Korlantas Polri
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>Mulai Kuis</Text>
        <Ionicons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderQuestion = () => {
    const question = selectedQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;

    return (
      <View style={styles.questionContainer}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.questionNumber}>
          Pertanyaan {currentQuestionIndex + 1} dari {selectedQuestions.length}
        </Text>

        <View style={styles.timerContainer}>
          <Ionicons name="time" size={24} color={timeLeft <= 3 ? "#FF3B30" : COLORS.PRIMARY} />
          <Text style={[styles.timerText, timeLeft <= 3 && styles.timerTextDanger]}>
            {timeLeft}s
          </Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

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

        {selectedAnswer !== null && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}
      </View>
    );
  };

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
          <Text style={[styles.resultTitle, { color: resultColor }]}>{resultText}</Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Total Skor</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreDetail}>
              {correctCount} dari {selectedQuestions.length} benar
            </Text>
          </View>
        </View>

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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.playAgainButton} onPress={startGame}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.playAgainButtonText}>Main Lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLeaderboard = () => {
    const currentUserRank = leaderboard.findIndex((entry) => entry.name === user?.name) + 1;
    const canClaimReward = currentUserRank > 0 && currentUserRank <= 3;

    const handleClaimRewardItem = (reward: Reward) => {
      Alert.alert(
        "Claim Reward",
        `Yakin ingin claim "${reward.name}" dengan ${reward.points} poin?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Claim",
            onPress: () => {
              claimReward(reward);
              setShowRewardsModal(false);
            },
          },
        ]
      );
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
                onPress={() => setShowRewardsModal(true)}
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
                style={[styles.leaderboardItem, isCurrentUser && styles.leaderboardItemHighlight]}
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
                    {entry.correctAnswers}/{entry.totalQuestions} benar •{" "}
                    {new Date(entry.date).toLocaleDateString("id-ID")}
                  </Text>
                </View>

                <View style={styles.leaderboardRight}>
                  <Text style={styles.leaderboardScore}>{entry.score}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

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
                      style={[styles.rewardItem, !canClaim && styles.rewardItemDisabled]}
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
                        <Text style={[styles.rewardName, !canClaim && styles.rewardNameDisabled]}>
                          {reward.name}
                        </Text>
                        <View style={styles.rewardPoints}>
                          <Ionicons
                            name="star"
                            size={14}
                            color={canClaim ? "#FFD700" : "#D1D5DB"}
                          />
                          <Text
                            style={[
                              styles.rewardPointsText,
                              !canClaim && styles.rewardPointsTextDisabled,
                            ]}
                          >
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
                        <Ionicons name={reward.icon as any} size={28} color={COLORS.PRIMARY} />
                      </View>

                      <View style={styles.rewardInfo}>
                        <Text style={styles.rewardName}>{reward.name}</Text>
                        <View style={styles.rewardPoints}>
                          <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                          <Text style={styles.myRewardClaimedText}>Telah diklaim</Text>
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
      <AppHeader onLogout={handleLogout} />

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

      {activeTab === "quiz" ? (!gameStarted ? renderStartScreen() : showResult ? renderResult() : renderQuestion()) : renderLeaderboard()}
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 32,
    textAlign: "center",
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
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 12,
    flex: 1,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  questionContainer: {
    flex: 1,
    padding: 24,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  questionNumber: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  timerTextDanger: {
    color: "#FF3B30",
  },
  questionCard: {
    backgroundColor: COLORS.CARD,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  optionButtonCorrect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#34C759",
  },
  optionButtonWrong: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  optionKeyContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionKey: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  optionTextCorrect: {
    flex: 1,
    fontSize: 16,
    color: "#059669",
    fontWeight: "700",
  },
  optionTextWrong: {
    flex: 1,
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "700",
  },
  explanationCard: {
    backgroundColor: "#E0F2FE",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#0EA5E9",
  },
  explanationText: {
    fontSize: 14,
    color: "#0369A1",
    lineHeight: 20,
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    alignItems: "center",
    padding: 24,
  },
  resultEmoji: {
    fontSize: 64,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
  },
  scoreCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    marginVertical: 8,
  },
  scoreDetail: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryScrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  summaryContentContainer: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  summaryItem: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginRight: 8,
  },
  summaryDetails: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  playAgainButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
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
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  rewardsList: {
    maxHeight: 400,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rewardItemDisabled: {
    opacity: 0.6,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
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
    fontSize: 12,
    color: "#6B7280",
  },
  rewardPointsTextDisabled: {
    color: "#D1D5DB",
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
    backgroundColor: "#F0F9FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  myRewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  myRewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  myRewardPoints: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  myRewardClaimedText: {
    fontSize: 12,
    color: "#34C759",
  },
  emptyMyRewards: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyMyRewardsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
  },
  emptyMyRewardsText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginTop: 4,
  },
});
