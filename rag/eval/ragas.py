"""
RAGAS Scoring Module
Computes faithfulness, context precision, and answer relevancy.
"""

import logging
from typing import List, Dict
from ragas.metrics import faithfulness, context_precision, answer_relevancy
from ragas import evaluate
import pandas as pd

logger = logging.getLogger(__name__)


class RAGASEvaluator:
    """RAGAS evaluation metrics calculator."""

    def __init__(self):
        """Initialize the RAGAS evaluator."""
        self.results = []

    def evaluate_single(
        self,
        question: str,
        answer: str,
        contexts: List[str],
        expected_answer: str = None,
    ) -> Dict:
        """
        Evaluate a single question-answer pair.

        Args:
            question: User question
            answer: Generated answer
            contexts: Retrieved context chunks
            expected_answer: Ground truth answer (optional)

        Returns:
            Dictionary with RAGAS scores
        """
        if not contexts:
            return {
                "faithfulness": 0.0,
                "context_precision": 0.0,
                "answer_relevancy": 0.0,
            }

        # Create DataFrame for RAGAS
        df = pd.DataFrame({
            "question": [question],
            "answer": [answer],
            "contexts": [contexts],
        })

        try:
            # Calculate metrics
            result = evaluate(
                dataframe=df,
                metrics=[
                    faithfulness,
                    context_precision,
                    answer_relevancy,
                ],
            )

            return {
                "faithfulness": result["faithfulness"].iloc[0],
                "context_precision": result["context_precision"].iloc[0],
                "answer_relevancy": result["answer_relevancy"].iloc[0],
            }

        except Exception as e:
            logger.error(f"RAGAS evaluation error: {e}")
            return {
                "faithfulness": 0.0,
                "context_precision": 0.0,
                "answer_relevancy": 0.0,
            }

    def evaluate_batch(
        self,
        questions: List[str],
        answers: List[str],
        contexts_list: List[List[str]],
    ) -> Dict:
        """
        Evaluate multiple question-answer pairs.

        Args:
            questions: List of questions
            answers: List of answers
            contexts_list: List of context lists

        Returns:
            Dictionary with aggregate RAGAS scores
        """
        if not questions:
            return {
                "faithfulness": 0.0,
                "context_precision": 0.0,
                "answer_relevancy": 0.0,
                "total": 0,
            }

        # Filter out empty contexts
        valid_data = []
        for q, a, c in zip(questions, answers, contexts_list):
            if c:
                valid_data.append({"question": q, "answer": a, "contexts": c})

        if not valid_data:
            return {
                "faithfulness": 0.0,
                "context_precision": 0.0,
                "answer_relevancy": 0.0,
                "total": 0,
            }

        df = pd.DataFrame(valid_data)

        try:
            result = evaluate(
                dataframe=df,
                metrics=[
                    faithfulness,
                    context_precision,
                    answer_relevancy,
                ],
            )

            return {
                "faithfulness": float(result["faithfulness"].mean()),
                "context_precision": float(result["context_precision"].mean()),
                "answer_relevancy": float(result["answer_relevancy"].mean()),
                "total": len(valid_data),
            }

        except Exception as e:
            logger.error(f"RAGAS batch evaluation error: {e}")
            return {
                "faithfulness": 0.0,
                "context_precision": 0.0,
                "answer_relevancy": 0.0,
                "total": len(valid_data),
            }


def calculate_ragas_scores(
    question: str,
    answer: str,
    contexts: List[str],
) -> Dict:
    """
    Calculate RAGAS scores for a single response.

    Args:
        question: User question
        answer: Generated answer
        contexts: Retrieved context chunks

    Returns:
        Dictionary with scores
    """
    evaluator = RAGASEvaluator()
    return evaluator.evaluate_single(question, answer, contexts)


if __name__ == "__main__":
    # Test with sample data
    evaluator = RAGASEvaluator()
    result = evaluator.evaluate_single(
        question="What is PM-KISAN?",
        answer="PM-KISAN is a government scheme that provides Rs. 6000 per year to farmers.",
        contexts=["PM-KISAN provides Rs. 6000 per year to farmer families."],
    )
    print("RAGAS Score:", result)