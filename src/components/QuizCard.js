// src/components/QuizCard.js
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const RIGHT_BG = "#E3F1EE";
const WRONG_BG = "#FBE9E4";

function Question({ item, number, total, answer, onAnswer, onReset }) {
  const answered = answer !== undefined;
  const known = item.correctIndex >= 0;
  const isCorrect = answered && known && answer === item.correctIndex;

  return (
    <View style={styles.card}>
      <Text style={styles.counter}>
        Question {number} of {total}
      </Text>
      <Text style={styles.question}>{item.question}</Text>

      <View style={{ gap: 8, marginTop: 12 }}>
        {item.options.map((option, i) => {
          const picked = answer === i;
          const showRight = answered && known && i === item.correctIndex;
          const showWrong =
            answered && known && picked && i !== item.correctIndex;

          return (
            <Pressable
              key={`${i}-${option}`}
              disabled={answered}
              onPress={() => onAnswer(i)}
              style={[
                styles.option,
                showRight && {
                  backgroundColor: RIGHT_BG,
                  borderColor: colors.teal,
                },
                showWrong && {
                  backgroundColor: WRONG_BG,
                  borderColor: "#FF0000",
                },
                answered && !known && picked && { borderColor: colors.teal },
                answered &&
                  !showRight &&
                  !showWrong &&
                  !picked && { opacity: 0.55 },
              ]}
            >
              <View
                style={[
                  styles.letter,
                  showRight && { backgroundColor: colors.teal },
                ]}
              >
                <Text
                  style={[
                    styles.letterText,
                    showRight && { color: colors.white },
                  ]}
                >
                  {LETTERS[i] ?? i + 1}
                </Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {showRight && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.teal}
                />
              )}
              {showWrong && (
                <Ionicons name="close-circle" size={20} color="#FF0000" />
              )}
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View style={styles.feedback}>
          {known ? (
            <Text
              style={[
                styles.feedbackTitle,
                { color: isCorrect ? colors.teal : "#FF0000" },
              ]}
            >
              {isCorrect
                ? "Correct!"
                : `Not quite. The answer is ${item.options[item.correctIndex]}.`}
            </Text>
          ) : (
            <Text style={styles.feedbackTitle}>Answer recorded.</Text>
          )}
          {item.explanation ? (
            <Text style={styles.explanation}>{item.explanation}</Text>
          ) : null}
          <Pressable onPress={onReset} hitSlop={8}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function QuizCard({ questions }) {
  const [answers, setAnswers] = useState({});

  if (!questions || questions.length === 0) return null;

  const gradable = questions.filter((q) => q.correctIndex >= 0).length;
  const correct = questions.filter(
    (q, i) =>
      answers[i] !== undefined &&
      q.correctIndex >= 0 &&
      answers[i] === q.correctIndex,
  ).length;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.titleRow}>
        <Ionicons name="help-circle-outline" size={20} color={colors.teal} />
        <Text style={styles.title}>Test your knowledge</Text>
      </View>

      {questions.map((item, i) => (
        <Question
          key={`${i}-${item.question}`}
          item={item}
          number={i + 1}
          total={questions.length}
          answer={answers[i]}
          onAnswer={(choice) =>
            setAnswers((current) => ({ ...current, [i]: choice }))
          }
          onReset={() =>
            setAnswers((current) => {
              const next = { ...current };
              delete next[i];
              return next;
            })
          }
        />
      ))}

      {allAnswered && gradable > 0 && (
        <View style={styles.summary}>
          <Ionicons name="trophy-outline" size={20} color={colors.white} />
          <Text style={styles.summaryText}>
            You got {correct} of {gradable} correct
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  counter: { fontSize: 11.5, fontWeight: "600", color: colors.gray },
  question: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 4,
    lineHeight: 21,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.sand,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
  },
  letter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  optionText: { flex: 1, fontSize: 13.5, color: colors.ink },
  feedback: { marginTop: 12, gap: 6 },
  feedbackTitle: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
  explanation: { fontSize: 12.5, color: colors.gray, lineHeight: 18 },
  retry: { fontSize: 12.5, fontWeight: "600", color: colors.teal },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.teal,
    borderRadius: 14,
    padding: 14,
  },
  summaryText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
