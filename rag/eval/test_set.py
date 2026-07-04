"""
Evaluation Test Set
30 questions covering three tool categories.
"""

from typing import List, Dict

# Expected tool for each question
TEST_SET: List[Dict] = [
    # === RAG Tool Questions (Government Schemes) ===
    {"question": "What is PM-KISAN scheme and how do I apply?", "expected_tool": "rag"},
    {"question": "How can I get Kisan Credit Card benefits?", "expected_tool": "rag"},
    {"question": "What is Pradhan Mantri Fasal Bima Yojana?", "expected_tool": "rag"},
    {"question": "What government schemes are available for farmers?", "expected_tool": "rag"},
    {"question": "How do I register for PM-KISAN online?", "expected_tool": "rag"},

    # === RAG Tool Questions (Crop Cultivation) ===
    {"question": "How to cultivate rice in monsoon season?", "expected_tool": "rag"},
    {"question": "What are best practices for wheat farming?", "expected_tool": "rag"},
    {"question": "How do I control stem borer in paddy?", "expected_tool": "rag"},
    {"question": "What is organic pest control for vegetables?", "expected_tool": "rag"},
    {"question": "When should I harvest wheat?", "expected_tool": "rag"},
    {"question": "How to apply NPK fertilizers correctly?", "expected_tool": "rag"},
    {"question": "What is drip irrigation and its benefits?", "expected_tool": "rag"},

    # === Crop Prediction Tool Questions ===
    {"question": "What crop should I grow with N=90, P=42, K=43?", "expected_tool": "crop_prediction"},
    {"question": "Recommend a crop for clay soil with pH 6.5", "expected_tool": "crop_prediction"},
    {"question": "What will be the yield for 5 acres of maize?", "expected_tool": "crop_prediction"},
    {"question": "Predict crop for temperature 25C, humidity 70%, rainfall 150mm", "expected_tool": "crop_prediction"},
    {"question": "Which crop is suitable for my soil with low nitrogen?", "expected_tool": "crop_prediction"},
    {"question": "Give me crop recommendation for sandy soil", "expected_tool": "crop_prediction"},

    # === Utility Tool Questions ===
    {"question": "Convert 5 acres to hectares", "expected_tool": "farm_utility"},
    {"question": "How much urea do I need for 2 acres of rice?", "expected_tool": "farm_utility"},
    {"question": "Calculate fertilizer for 10 acres of wheat", "expected_tool": "farm_utility"},
    {"question": "Convert 100 kg to quintals", "expected_tool": "farm_utility"},
    {"question": "How much DAP required for 3 acres?", "expected_tool": "farm_utility"},
    {"question": "What is 5 hectares in acres?", "expected_tool": "farm_utility"},

    # === General/Decline Questions ===
    {"question": "What is the weather today?", "expected_tool": "decline"},
    {"question": "Tell me a joke", "expected_tool": "decline"},
    {"question": "Who is the President of India?", "expected_tool": "decline"},
    {"question": "What is Python programming?", "expected_tool": "decline"},
]


def get_test_set() -> List[Dict]:
    """Return the evaluation test set."""
    return TEST_SET


def get_questions_by_tool(tool: str) -> List[str]:
    """Get questions for a specific tool."""
    return [q["question"] for q in TEST_SET if q["expected_tool"] == tool]


def get_rag_questions() -> List[str]:
    """Get RAG tool questions."""
    return get_questions_by_tool("rag")


def get_crop_questions() -> List[str]:
    """Get crop prediction questions."""
    return get_questions_by_tool("crop_prediction")


def get_utility_questions() -> List[str]:
    """Get utility tool questions."""
    return get_questions_by_tool("farm_utility")


def get_general_questions() -> List[str]:
    """Get general questions that should be declined."""
    return get_questions_by_tool("decline")


if __name__ == "__main__":
    print(f"Total questions: {len(TEST_SET)}")
    print(f"RAG questions: {len(get_rag_questions())}")
    print(f"Crop questions: {len(get_crop_questions())}")
    print(f"Utility questions: {len(get_utility_questions())}")
    print(f"General questions: {len(get_general_questions())}")