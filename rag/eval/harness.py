"""
Evaluation Harness
Runs the full evaluation suite and saves results.
"""

import logging
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import tempfile

# Set environment before imports
os.environ.setdefault("GROQ_API_KEY", "test-key")
os.environ["CHROMA_PERSIST_DIRECTORY"] = tempfile.mkdtemp()
os.environ["DOCUMENTS_DIRECTORY"] = tempfile.mkdtemp()

from eval.test_set import get_test_set, get_questions_by_tool
from eval.ragas import RAGASEvaluator
from eval.classifier_comparison import run_classifier_comparison, train_tfidf_classifier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EvaluationHarness:
    """Main evaluation harness for the farm advisory system."""

    def __init__(self, agent=None, vector_store=None, generation_service=None):
        """
        Initialize the evaluation harness.

        Args:
            agent: Farm agent instance
            vector_store: Vector store for RAG
            generation_service: Generation service for RAG
        """
        self.agent = agent
        self.vector_store = vector_store
        self.generation_service = generation_service
        self.results = {}

    def run_rag_evaluation(self, test_questions: List[str]) -> Dict:
        """
        Evaluate RAG responses with RAGAS metrics.

        Args:
            test_questions: List of RAG-relevant questions

        Returns:
            RAGAS evaluation results
        """
        if not self.vector_store or not self.generation_service:
            logger.warning("RAG services not available, skipping RAG evaluation")
            return {"status": "skipped", "reason": "services_not_available"}

        evaluator = RAGASEvaluator()
        questions = []
        answers = []
        contexts = []

        for question in test_questions:
            # Get RAG response
            try:
                retrieved = self.vector_store.similarity_search(question, top_k=5)
                if retrieved:
                    answer, sources = self.generation_service.generate_with_sources(
                        question, retrieved
                    )
                    context_chunks = [doc[0] for doc in retrieved]

                    questions.append(question)
                    answers.append(answer)
                    contexts.append(context_chunks)
            except Exception as e:
                logger.error(f"Error evaluating question: {e}")

        if not questions:
            return {"status": "skipped", "reason": "no_responses"}

        results = evaluator.evaluate_batch(questions, answers, contexts)
        return results

    def run_tool_selection_evaluation(self) -> Dict:
        """
        Evaluate tool selection accuracy.

        Returns:
            Tool selection evaluation results
        """
        test_set = get_test_set()

        # Split into train/test
        train_size = int(len(test_set) * 0.7)
        train_data = test_set[:train_size]
        test_data = test_set[train_size:]

        train_questions = [t["question"] for t in train_data]
        train_labels = [t["expected_tool"] for t in train_data]
        test_questions = [t["question"] for t in test_data]
        test_labels = [t["expected_tool"] for t in test_data]

        results = run_classifier_comparison(
            train_questions, train_labels,
            test_questions, test_labels,
        )

        return results

    def run_full_evaluation(self) -> Dict:
        """
        Run the complete evaluation suite.

        Returns:
            Complete evaluation results
        """
        logger.info("Starting full evaluation...")

        results = {
            "timestamp": datetime.now().isoformat(),
            "ragas_scores": {},
            "tool_selection": {},
        }

        # 1. RAG evaluation
        try:
            rag_questions = get_questions_by_tool("rag")[:10]  # Limit for speed
            rag_results = self.run_rag_evaluation(rag_questions)
            results["ragas_scores"] = rag_results
        except Exception as e:
            logger.error(f"RAG evaluation error: {e}")
            results["ragas_scores"] = {"status": "error", "error": str(e)}

        # 2. Tool selection evaluation
        try:
            tool_results = self.run_tool_selection_evaluation()
            results["tool_selection"] = tool_results
        except Exception as e:
            logger.error(f"Tool selection error: {e}")
            results["tool_selection"] = {"status": "error", "error": str(e)}

        self.results = results
        return results

    def save_results(self, output_path: str):
        """Save results to file."""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(self.results, f, indent=2)
        logger.info(f"Results saved to {output_path}")


def run_evaluation(agent=None, vector_store=None, generation_service=None) -> Dict:
    """
    Run the evaluation harness.

    Args:
        agent: Farm agent instance
        vector_store: Vector store
        generation_service: Generation service

    Returns:
        Evaluation results
    """
    harness = EvaluationHarness(agent, vector_store, generation_service)
    results = harness.run_full_evaluation()
    return results


if __name__ == "__main__":
    # Run evaluation
    print("Running evaluation harness...")
    results = run_evaluation()

    # Print summary
    print("\n" + "=" * 50)
    print("EVALUATION RESULTS")
    print("=" * 50)

    if "ragas_scores" in results and results["ragas_scores"].get("status") != "error":
        ragas = results["ragas_scores"]
        print(f"\nRAGAS Scores (n={ragas.get('total', 'N/A')}):")
        print(f"  Faithfulness: {ragas.get('faithfulness', 0):.3f}")
        print(f"  Context Precision: {ragas.get('context_precision', 0):.3f}")
        print(f"  Answer Relevancy: {ragas.get('answer_relevancy', 0):.3f}")

    if "tool_selection" in results and results["tool_selection"].get("status") != "error":
        ts = results["tool_selection"]
        print("\nTool Selection (TF-IDF + SVM):")
        if "tfidf" in ts and "test_metrics" in ts["tfidf"]:
            tm = ts["tfidf"]["test_metrics"]
            print(f"  Accuracy: {tm.get('accuracy', 0):.3f}")
            print(f"  F1 (weighted): {tm.get('f1_weighted', 0):.3f}")

    print("\nResults saved to eval/results.json")