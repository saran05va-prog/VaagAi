"""
Query Intent Classifier Comparison
Compares TF-IDF + SVM baseline against LoRA fine-tuned model.
"""

import logging
import json
from typing import List, Dict, Tuple
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.metrics import classification_report, accuracy_score, f1_score

logger = logging.getLogger(__name__)

# Labels for classification
LABELS = ["rag", "crop_prediction", "farm_utility", "decline"]
LABEL_TO_IDX = {label: i for i, label in enumerate(LABELS)}
IDX_TO_LABEL = {i: label for i, label in enumerate(LABELS)}


class TFIDFClassifier:
    """TF-IDF + Linear SVM classifier for query intent."""

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=1000,
            min_df=1,
        )
        self.classifier = LinearSVC(
            C=1.0,
            max_iter=10000,
            dual=True,
        )
        self.is_trained = False

    def train(self, questions: List[str], labels: List[str]) -> Dict:
        """
        Train the classifier.

        Args:
            questions: List of questions
            labels: List of label strings

        Returns:
            Training results
        """
        # Convert labels to indices
        y = np.array([LABEL_TO_IDX[l] for l in labels])

        # Vectorize questions
        X = self.vectorizer.fit_transform(questions)

        # Train classifier
        self.classifier.fit(X, y)
        self.is_trained = True

        # Cross-validation
        cv_scores = cross_val_score(self.classifier, X, y, cv=5)

        return {
            "train_accuracy": float(self.classifier.score(X, y)),
            "cv_accuracy_mean": float(cv_scores.mean()),
            "cv_accuracy_std": float(cv_scores.std()),
        }

    def predict(self, questions: List[str]) -> List[str]:
        """
        Predict labels for questions.

        Args:
            questions: List of questions

        Returns:
            List of predicted labels
        """
        if not self.is_trained:
            raise ValueError("Classifier not trained")

        X = self.vectorizer.transform(questions)
        predictions = self.classifier.predict(X)

        return [IDX_TO_LABEL[p] for p in predictions]

    def predict_proba(self, question: str) -> Dict:
        """
        Get prediction probabilities for a single question.

        Args:
            question: Single question

        Returns:
            Dictionary with label probabilities
        """
        if not self.is_trained:
            raise ValueError("Classifier not trained")

        X = self.vectorizer.transform([question])
        # LinearSVC doesn't have predict_proba, use decision function
        decision = self.classifier.decision_function(X)[0]

        # Convert to pseudo-probabilities using softmax
        exp_decision = np.exp(decision - np.max(decision))
        probs = exp_decision / exp_decision.sum()

        return {LABELS[i]: float(probs[i]) for i in range(len(LABELS))}


def train_tfidf_classifier(questions: List[str], labels: List[str]) -> Tuple[TFIDFClassifier, Dict]:
    """
    Train TF-IDF classifier.

    Args:
        questions: Training questions
        labels: Training labels

    Returns:
        Tuple of (trained classifier, metrics)
    """
    classifier = TFIDFClassifier()
    metrics = classifier.train(questions, labels)
    return classifier, metrics


def evaluate_classifier(
    classifier: TFIDFClassifier,
    test_questions: List[str],
    test_labels: List[str],
) -> Dict:
    """
    Evaluate classifier on test set.

    Args:
        classifier: Trained classifier
        test_questions: Test questions
        test_labels: True labels

    Returns:
        Evaluation metrics
    """
    predictions = classifier.predict(test_questions)

    accuracy = accuracy_score(test_labels, predictions)
    f1 = f1_score(test_labels, predictions, average="weighted")

    report = classification_report(test_labels, predictions, target_names=LABELS, output_dict=True)

    return {
        "accuracy": accuracy,
        "f1_weighted": f1,
        "per_class": report,
    }


# Note: LoRA fine-tuning would require additional setup
# This is a placeholder for the comparison
def get_lora_results() -> Dict:
    """
    Placeholder for LoRA fine-tuned model results.
    In practice, this would:
    1. Fine-tune Phi-3-mini or Llama-3.2-1B with LoRA
    2. Run inference on test set
    3. Return evaluation metrics
    """
    return {
        "note": "LoRA fine-tuning requires GPU and additional setup",
        "accuracy": None,
        "f1_weighted": None,
    }


def run_classifier_comparison(
    train_questions: List[str],
    train_labels: List[str],
    test_questions: List[str],
    test_labels: List[str],
) -> Dict:
    """
    Run full classifier comparison.

    Args:
        train_questions: Training questions
        train_labels: Training labels
        test_questions: Test questions
        test_labels: Test labels

    Returns:
        Comparison results
    """
    # Train TF-IDF classifier
    tfidf_classifier, train_metrics = train_tfidf_classifier(train_questions, train_labels)

    # Evaluate on test set
    tfidf_results = evaluate_classifier(tfidf_classifier, test_questions, test_labels)

    # Get LoRA results (placeholder)
    lora_results = get_lora_results()

    return {
        "tfidf": {
            "train_metrics": train_metrics,
            "test_metrics": tfidf_results,
        },
        "lora": lora_results,
    }


def save_results(results: Dict, output_path: str):
    """Save results to file."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)


if __name__ == "__main__":
    # Demo with sample data
    train_q = [
        "What is PM-KISAN scheme?",
        "How to grow rice?",
        "Convert 5 acres to hectares",
        "What crop for N=90?",
    ]
    train_l = ["rag", "rag", "farm_utility", "crop_prediction"]

    clf, metrics = train_tfidf_classifier(train_q, train_l)
    print("Training metrics:", metrics)

    test_q = ["Government scheme?", "Urea calculation?"]
    preds = clf.predict(test_q)
    print("Predictions:", preds)