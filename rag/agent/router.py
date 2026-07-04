"""
Farm Advisory Agent
LangGraph-based router that decides which tool to use based on user query.
"""

import logging
from typing import Optional
from pydantic import BaseModel, Field
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from .tools import create_rag_tool, create_crop_tool, create_utility_tool

logger = logging.getLogger(__name__)


class AgentInput(BaseModel):
    """Input schema for agent."""
    question: str = Field(description="User question")
    session_id: Optional[str] = Field(None, description="Session ID for conversation memory")


class AgentOutput(BaseModel):
    """Output schema from agent."""
    answer: str = Field(description="Generated answer")
    tool_used: str = Field(description="Tool used to generate answer")
    sources: Optional[list] = Field(None, description="Source citations if available")


# System prompt for the agent
SYSTEM_PROMPT = """You are a helpful farming advisory assistant. Your job is to understand the user's question and route it to the appropriate tool.

You have access to three tools:

1. **farm_document_retrieval** - For questions about:
   - Government schemes (PM-KISAN, Kisan Credit Card, crop insurance)
   - Crop cultivation practices (rice, wheat, vegetables)
   - Pest management and organic farming
   - Fertilizer recommendations
   - Irrigation methods
   - General farming best practices from documents

2. **crop_prediction** - For questions about:
   - Crop recommendations based on soil NPK values
   - Yield predictions
   - What crops to grow given specific soil and climate conditions
   - Soil analysis and recommendations

3. **farm_utility** - For questions about:
   - Unit conversions (acres to hectares, kg to quintals)
   - Fertilizer dosage calculations
   - Farm area calculations

Analyze the question and call the appropriate tool. If unsure, prefer the document retrieval tool.

Always be helpful and provide accurate information based on the tool's response."""


class FarmAgent:
    """Farm advisory agent with tool routing."""

    def __init__(
        self,
        groq_api_key: str,
        vector_store=None,
        generation_service=None,
        backend_url: str = "http://localhost:3002",
        model_name: str = "llama-3-70b-versatile",
    ):
        self.groq_api_key = groq_api_key
        self.backend_url = backend_url

        # Initialize LLM
        self.llm = ChatGroq(
            api_key=groq_api_key,
            model=model_name,
            temperature=0.3,
        )

        # Create tools
        self.rag_tool = create_rag_tool(vector_store, generation_service)
        self.crop_tool = create_crop_tool(backend_url)
        self.utility_tool = create_utility_tool()

        # Create tools list
        tools = [self.rag_tool, self.crop_tool, self.utility_tool]

        # Create agent
        self.agent = create_react_agent(
            self.llm,
            tools=tools,
            prompt=SystemMessage(content=SYSTEM_PROMPT),
        )

        # Conversation history (simple in-memory store)
        self.conversation_history: dict[str, list] = {}

        logger.info("Farm agent initialized with tools: farm_document_retrieval, crop_prediction, farm_utility")

    def _get_history(self, session_id: str) -> list:
        """Get conversation history for a session."""
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        return self.conversation_history[session_id]

    def _add_to_history(self, session_id: str, role: str, content: str):
        """Add message to conversation history."""
        history = self._get_history(session_id)
        if role == "user":
            history.append(HumanMessage(content=content))
        elif role == "assistant":
            history.append(AIMessage(content=content))

    def run(self, question: str, session_id: Optional[str] = None) -> AgentOutput:
        """
        Run the agent on a question.

        Args:
            question: User question
            session_id: Optional session ID for conversation memory

        Returns:
            AgentOutput with answer and tool used
        """
        if not session_id:
            session_id = "default"

        # Add question to history
        self._add_to_history(session_id, "user", question)

        # Get conversation history
        history = self._get_history(session_id)

        try:
            # Run agent
            result = self.agent.invoke({"messages": history})

            # Get the last AI message
            response_message = result["messages"][-1]
            answer = response_message.content if hasattr(response_message, "content") else str(response_message)

            # Determine which tool was used
            tool_used = "unknown"
            sources = None

            # Check tool invocations in the message history
            for msg in result["messages"]:
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        if tc.get("name"):
                            tool_used = tc["name"]
                            break

            # Try to extract sources if available
            if "Sources:" in answer or "Source:" in answer:
                # Extract sources from RAG response
                lines = answer.split("\n")
                source_lines = [l for l in lines if "Source:" in l or l.startswith("- ")]
                if source_lines:
                    sources = [{"content": " ".join(source_lines)}]

            # Add response to history
            self._add_to_history(session_id, "assistant", answer)

            return AgentOutput(
                answer=answer,
                tool_used=tool_used,
                sources=sources,
            )

        except Exception as e:
            logger.error(f"Agent error: {e}")
            error_msg = f"I encountered an error processing your question: {str(e)}"
            self._add_to_history(session_id, "assistant", error_msg)
            return AgentOutput(
                answer=error_msg,
                tool_used="error",
                sources=None,
            )

    def clear_history(self, session_id: str):
        """Clear conversation history for a session."""
        if session_id in self.conversation_history:
            self.conversation_history[session_id] = []


def create_farm_agent(
    groq_api_key: str,
    vector_store=None,
    generation_service=None,
    backend_url: str = "http://localhost:3002",
    model_name: str = "llama-3-70b-versatile",
) -> FarmAgent:
    """Factory function to create farm agent."""
    return FarmAgent(
        groq_api_key=groq_api_key,
        vector_store=vector_store,
        generation_service=generation_service,
        backend_url=backend_url,
        model_name=model_name,
    )