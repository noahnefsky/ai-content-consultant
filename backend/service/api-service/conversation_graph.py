"""
Conversation Graph using LangGraph for managing chat context and state.
This module implements a state machine for managing conversation flow and context.
"""

import os
import json
from typing import Annotated, Dict, List, Optional, Any
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from google import genai
from google.genai import types
from configs import logger
from datetime import datetime

# Initialize the LLM using the existing Google GenAI SDK
client = genai.Client(api_key="")

class ConversationState(TypedDict):
    """State for the conversation graph."""
    # Messages have the type "list". The `add_messages` function
    # defines how this state key should be updated (appends messages)
    messages: Annotated[List, add_messages]
    
    # Additional context for content generation
    user_context: Dict[str, Any]  # User preferences, platform info, etc.
    content_history: List[Dict[str, Any]]  # Previously generated content
    conversation_summary: Optional[str]  # Summary of conversation so far

def create_conversation_graph():
    """Create and configure the conversation state graph."""
    
    # Create the state graph
    graph_builder = StateGraph(ConversationState)
    
    # Add the main conversation node
    graph_builder.add_node("conversation_agent", conversation_agent)
    
    # Add the content generation node
    graph_builder.add_node("content_generator", content_generator)
    
    # Add the context analyzer node
    graph_builder.add_node("context_analyzer", context_analyzer)
    
    # Define the flow
    graph_builder.add_edge(START, "context_analyzer")
    graph_builder.add_edge("context_analyzer", "conversation_agent")
    graph_builder.add_edge("conversation_agent", "content_generator")
    graph_builder.add_edge("content_generator", END)
    
    # Compile the graph
    return graph_builder.compile()

def context_analyzer(state: ConversationState) -> ConversationState:
    """Analyze the current conversation context and user intent."""
    messages = state.get("messages", [])
    user_context = state.get("user_context", {})
    print("user_context", user_context)
    
    if not messages:
        return state
    
    # Get the latest user message
    latest_message = messages[-1]
    if isinstance(latest_message, HumanMessage):
        user_input = str(latest_message.content)
        
        # Analyze intent
        intent = analyze_user_intent(user_input)
        
        # Analyze conversation continuity - check if user is referencing previous content
        is_continuation = analyze_conversation_continuity(user_input, messages, user_context)
        
        # Update context with better continuity tracking
        updated_context = {
            **user_context,  # Preserve all existing context
            "current_intent": intent,
            "message_count": len(messages),
            "last_user_input": user_input,
            "is_continuation": is_continuation,
            "conversation_topic": extract_conversation_topic(messages),
            "last_content_reference": find_last_content_reference(user_input, user_context.get("content_history", []))
        }
        
        return {
            **state,
            "user_context": updated_context
        }
    
    return state

def analyze_conversation_continuity(user_input: str, messages: List, user_context: Dict) -> bool:
    """Check if the user is continuing a previous conversation topic."""
    user_input_lower = user_input.lower()
    
    # Check for continuation keywords
    continuation_keywords = [
        "more", "another", "different", "similar", "like that", "chaotic", "funnier",
        "better", "worse", "change", "modify", "update", "improve", "variation",
        "make it", "but", "instead", "also", "what about", "how about"
    ]
    
    # Check if user is referencing previous content
    if any(keyword in user_input_lower for keyword in continuation_keywords):
        return True
    
    # Check if user mentions previous topics
    if len(messages) > 2:  # Has previous conversation
        recent_topics = extract_recent_topics(messages[-6:])  # Last 6 messages
        for topic in recent_topics:
            if topic.lower() in user_input_lower:
                return True
    
    return False

def extract_conversation_topic(messages: List) -> str:
    """Extract the main topic from recent conversation."""
    if len(messages) < 2:
        return "general"
    
    # Look at recent messages to find recurring themes
    recent_content = ""
    for msg in messages[-6:]:  # Last 6 messages
        if hasattr(msg, 'content'):
            recent_content += str(msg.content).lower() + " "
    
    # Common content topics
    topics = {
        "coffee": ["coffee", "morning", "caffeine", "brew"],
        "workout": ["workout", "fitness", "exercise", "gym"],
        "cooking": ["cooking", "recipe", "food", "kitchen"],
        "dance": ["dance", "dancing", "choreography", "music"],
        "transformation": ["before", "after", "transformation", "change"],
        "morning routine": ["morning", "routine", "wake up", "start day"],
        "chaos": ["chaotic", "crazy", "wild", "messy", "dramatic"]
    }
    
    for topic, keywords in topics.items():
        if any(keyword in recent_content for keyword in keywords):
            return topic
    
    return "general"

def extract_recent_topics(messages: List) -> List[str]:
    """Extract topics from recent messages."""
    topics = []
    for msg in messages:
        if hasattr(msg, 'content'):
            content = str(msg.content).lower()
            # Extract key nouns and topics
            words = content.split()
            for word in words:
                if len(word) > 4 and word.isalpha():  # Filter for meaningful words
                    topics.append(word)
    return list(set(topics))  # Remove duplicates

def find_last_content_reference(user_input: str, content_history: List) -> Optional[Dict]:
    """Find if user is referencing a specific piece of previous content."""
    if not content_history:
        return None
    
    user_input_lower = user_input.lower()
    
    # Check the most recent content items
    for content_item in reversed(content_history[-3:]):  # Last 3 items
        content_data = content_item.get("data", {})
        idea = content_data.get("idea", "").lower()
        
        # Check for topic overlap
        idea_words = set(idea.split())
        input_words = set(user_input_lower.split())
        
        # If there's significant word overlap, this might be a reference
        if len(idea_words.intersection(input_words)) >= 2:
            return content_item
    
    return None

def conversation_agent(state: ConversationState) -> ConversationState:
    """Main conversation agent that handles user interactions."""
    messages = state.get("messages", [])
    user_context = state.get("user_context", {})
    
    if not messages:
        return state
    
    # Create system message based on context
    system_prompt = create_system_prompt(user_context)
    
    # Get the latest user message
    latest_message = messages[-1]
    if isinstance(latest_message, HumanMessage):
        user_input = str(latest_message.content)
        
        # Build more comprehensive conversation context
        conversation_context = build_conversation_context(messages, user_context)
        
        # Combine system prompt with conversation context
        full_prompt = system_prompt + conversation_context
        
        # Generate response using Google GenAI
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=user_input,
                config=types.GenerateContentConfig(
                    system_instruction=full_prompt
                )
            )
            
            response_content = response.text if response.text else "I'm having trouble processing your request."
            
            # Check if this should trigger content generation
            should_generate_content = should_generate_content_check(response_content, user_context)
            
            logger.info(f"conversation_agent: should_generate_content={should_generate_content}, user_input='{user_input}', current_intent={user_context.get('current_intent')}")
            
            # Create the AI response message
            ai_message = AIMessage(content=response_content)
            
            # Always preserve existing context when updating
            preserved_context = {
                **user_context,  # Keep all existing context
                "needs_content_generation": should_generate_content,
                "last_response": response_content
            }
            
            if should_generate_content:
                preserved_context["content_prompt"] = extract_content_prompt(response_content, user_context)
            
            return {
                **state,  # Preserve all existing state
                "messages": [ai_message],  # This will be appended by add_messages
                "user_context": preserved_context
            }
                
        except Exception as e:
            logger.error(f"Error in conversation_agent: {e}")
            error_message = AIMessage(content="I'm having trouble processing your request. Please try again.")
            return {
                **state,  # Preserve existing state even on error
                "messages": [error_message]
            }
    
    return state

def build_conversation_context(messages: List, user_context: Dict) -> str:
    """Build comprehensive conversation context for the AI."""
    context_parts = []
    
    # Add recent conversation history
    if len(messages) > 1:
        context_parts.append("\n\nRECENT CONVERSATION HISTORY:")
        recent_messages = messages[-8:-1]  # Last 8 messages excluding current
        for i, msg in enumerate(recent_messages):
            if isinstance(msg, HumanMessage):
                context_parts.append(f"User: {msg.content}")
            elif isinstance(msg, AIMessage):
                # Truncate long responses but keep key info
                content = str(msg.content)
                if len(content) > 300:
                    content = content[:300] + "..."
                context_parts.append(f"Assistant: {content}")
    
    # Add conversation continuity info
    if user_context.get("is_continuation"):
        context_parts.append(f"\n\nCONTINUITY ALERT: The user is continuing/modifying the previous topic: '{user_context.get('conversation_topic', 'unknown')}'")
        
        # Add reference to last content if found
        last_content_ref = user_context.get("last_content_reference")
        if last_content_ref:
            last_idea = last_content_ref.get("data", {}).get("idea", "")
            context_parts.append(f"They're specifically referencing this previous content: '{last_idea}'")
    
    # Add content history context
    content_history = user_context.get("content_history", [])
    if content_history:
        context_parts.append(f"\n\nCONTENT HISTORY: User has {len(content_history)} previous content ideas.")
        if len(content_history) > 0:
            last_content = content_history[-1].get("data", {})
            context_parts.append(f"Most recent: '{last_content.get('idea', 'No idea')}'")
    
    # Add platform and trending context
    print(user_context.get(""))
    selected_platforms = user_context.get("selected_platforms", [])
    if selected_platforms:
        context_parts.append(f"\n\nPLATFORMS: {', '.join(selected_platforms)}")
    
    return "\n".join(context_parts)

def content_generator(state: ConversationState) -> ConversationState:
    """Generate structured content when requested."""
    messages = state.get("messages", [])
    user_context = state.get("user_context", {})
    content_history = state.get("content_history", [])
    
    # Check if content generation is needed
    if not user_context.get("needs_content_generation", False):
        logger.info(f"content_generator: Skipping content generation, needs_content_generation=False")
        return state
    
    logger.info(f"content_generator: Starting content generation, content_prompt='{user_context.get('content_prompt', '')}'")
    
    try:
        # Create content generation prompt with better context
        content_prompt = user_context.get("content_prompt", "")
        if not content_prompt:
            return state
        
        # Enhanced content system prompt with continuation awareness
        content_system_prompt = create_content_system_prompt(user_context, content_history)
        
        # Add conversation context specifically for content generation
        content_context = build_content_generation_context(messages, user_context, content_history)
        full_content_prompt = content_system_prompt + content_context

        # Generate content using Google GenAI
        content_response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=content_prompt,
            config=types.GenerateContentConfig(
                system_instruction=full_content_prompt
            )
        )
        
        content_text = content_response.text if content_response.text else ""
        
        # Try to parse JSON from response
        try:
            content_data = json.loads(content_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, extract content from text
            content_data = extract_content_from_text(content_text)
        
        # Add to content history with better metadata
        new_content = {
            "id": f"content_{len(content_history) + 1}",
            "timestamp": str(datetime.now()),
            "data": content_data,
            "prompt": content_prompt,
            "conversation_topic": user_context.get("conversation_topic", "general"),
            "is_continuation": user_context.get("is_continuation", False),
            "referenced_content": user_context.get("last_content_reference", {}).get("id") if user_context.get("last_content_reference") else None
        }
        
        updated_content_history = content_history + [new_content]
        
        # Create clean response message
        response_content = format_content_response(content_data, user_context)
        
        response_message = AIMessage(
            content=response_content,
            additional_kwargs={"structured_content": content_data}
        )
        
        # Preserve all context and add new content
        updated_context = {
            **user_context,  # Preserve everything
            "needs_content_generation": False,
            "last_generated_content": content_data,
            "content_generation_count": user_context.get("content_generation_count", 0) + 1
        }
        
        return {
            **state,  # Preserve all existing state
            "messages": [response_message],
            "content_history": updated_content_history,
            "user_context": updated_context
        }
        
    except Exception as e:
        logger.error(f"Error in content_generator: {e}")
        error_message = AIMessage(content="I'm having trouble generating content. Please try again.")
        return {
            **state,  # Preserve existing state even on error
            "messages": [error_message]
        }

def create_content_system_prompt(user_context: Dict, content_history: List) -> str:
    """Create enhanced system prompt for content generation with continuation awareness."""
    base_prompt = """You are an expert content strategist specializing in viral social media content.

Generate structured content with this JSON format:
{
    "idea": "A clear, compelling concept that can go viral",
    "videoStructure": "A detailed, flowing description of how the video unfolds - describe the scenes, pacing, and visual flow in natural sentences without numbered steps",
    "caption": "Engaging caption that complements the video",
    "hashtags": ["relevant", "trending", "hashtags"]
}

CRITICAL CONTINUATION RULES:
- If this is a continuation/modification of previous content, acknowledge and build upon it
- When user asks to make something "more chaotic", "funnier", "different" etc., dramatically amplify those qualities
- Reference and improve upon previous ideas rather than creating completely new ones
- Maintain thematic consistency while adding requested modifications

VIDEO STRUCTURE GUIDELINES:
- Write in flowing, narrative sentences that describe the visual progression
- Avoid numbered steps or bullet points
- Use descriptive language that paints a picture of the video flow
- Include pacing, transitions, and visual elements naturally
- Make it feel like a story being told rather than a technical breakdown

IMPORTANT: Do NOT include quotes around any content in your JSON response. Write the content directly without quotation marks.

Return ONLY valid JSON, no additional text."""

    # Add continuation-specific instructions
    if user_context.get("is_continuation"):
        topic = user_context.get("conversation_topic", "the previous topic")
        base_prompt += f"\n\nCONTINUITY ALERT: This is a continuation of {topic}. Build upon and modify the previous content rather than starting fresh."
        
        last_content_ref = user_context.get("last_content_reference")
        if last_content_ref:
            last_idea = last_content_ref.get("data", {}).get("idea", "")
            base_prompt += f"\n\nPREVIOUS CONTENT TO BUILD UPON: {last_idea}"
    
    # Add content history context
    if content_history and len(content_history) > 0:
        recent_ideas = [item.get("data", {}).get("idea", "") for item in content_history[-3:]]
        base_prompt += f"\n\nRECENT CONTENT HISTORY: {'; '.join(recent_ideas)}"
    
    return base_prompt

def build_content_generation_context(messages: List, user_context: Dict, content_history: List) -> str:
    """Build specific context for content generation."""
    context_parts = []
    
    # Add the specific user request
    last_user_input = user_context.get("last_user_input", "")
    if last_user_input:
        context_parts.append(f"\n\nUSER REQUEST: {last_user_input}")
    
    # Add modification context if it's a continuation
    if user_context.get("is_continuation"):
        context_parts.append(f"\n\nMODIFICATION REQUEST: The user wants to modify/improve the previous content.")
        
        # Add specific modification keywords found
        modification_keywords = ["chaotic", "funnier", "more", "better", "different", "wilder", "crazier"]
        found_keywords = [kw for kw in modification_keywords if kw in last_user_input.lower()]
        if found_keywords:
            context_parts.append(f"Specifically: {', '.join(found_keywords)}")
    
    # Add platform context
    selected_platforms = user_context.get("selected_platforms", [])
    if selected_platforms:
        context_parts.append(f"\n\nTARGET PLATFORMS: {', '.join(selected_platforms)}")
    
    return "\n".join(context_parts)

def format_content_response(content_data: Dict, user_context: Dict) -> str:
    """Format the content response with continuation awareness."""
    base_response = f"Here's a viral content idea for you:\n\n**Idea:** {content_data.get('idea', 'No idea generated')}\n\n**Video Structure:** {content_data.get('videoStructure', 'No structure provided')}\n\n**Caption:** {content_data.get('caption', 'No caption generated')}\n\n**Hashtags:** {', '.join(['#' + tag for tag in content_data.get('hashtags', [])])}"
    
    # Add continuation acknowledgment
    if user_context.get("is_continuation"):
        continuation_count = user_context.get("content_generation_count", 0)
        if continuation_count > 0:
            base_response = f"Building on our previous idea with your requested changes:\n\n{base_response}"
    
    return base_response

def analyze_user_intent(user_input: str) -> str:
    """Analyze user input to determine intent with better continuation detection."""
    user_input_lower = user_input.lower()
    
    logger.info(f"analyze_user_intent: Analyzing '{user_input}'")
    
    # Modification/continuation keywords (highest priority)
    modification_keywords = [
        "make it", "more", "less", "different", "change", "modify", "update",
        "chaotic", "funnier", "better", "worse", "wilder", "crazier", "dramatic",
        "instead", "but", "however", "actually", "rather"
    ]
    
    # Content generation keywords
    content_keywords = [
        "create", "generate", "make", "produce", "develop", "come up with",
        "idea", "content", "video", "post", "caption", "hashtag", "trending"
    ]
    
    # Question keywords
    question_keywords = [
        "what", "how", "why", "when", "where", "which", "who",
        "explain", "tell me", "help", "advice", "suggest"
    ]
    
    # Search keywords
    search_keywords = [
        "find", "search", "look for", "trending", "popular", "viral"
    ]
    
    # Default to general conversation
    intent = "general_conversation"
    
    # Check for modification/continuation intent first
    if any(keyword in user_input_lower for keyword in modification_keywords):
        intent = "content_modification"
    # Check for content generation intent
    elif any(keyword in user_input_lower for keyword in content_keywords):
        intent = "content_generation"
    # Question keywords
    elif any(keyword in user_input_lower for keyword in question_keywords):
        intent = "question"
    # Search keywords
    elif any(keyword in user_input_lower for keyword in search_keywords):
        intent = "search"
    
    logger.info(f"analyze_user_intent: Returning '{intent}' for '{user_input}'")
    return intent

def create_system_prompt(user_context: Dict[str, Any]) -> str:
    """Create a system prompt based on conversation context with better continuity."""
    base_prompt = """You are an expert AI content consultant specializing in viral social media content creation. You help creators develop engaging, platform-optimized content that can go viral.

CRITICAL CONVERSATION CONTINUITY RULES:
- ALWAYS reference and build upon previous conversation topics and content
- If the user is modifying/improving previous content, acknowledge what they're changing
- When they say "make it more chaotic" or similar, you should understand they're referring to the previous content idea
- Maintain conversation flow - don't restart topics unless the user explicitly changes subjects
- Reference specific details from previous content when relevant
- Build upon established preferences and themes from the conversation

Your expertise includes:
- TikTok, Instagram, YouTube, and other social media platforms
- Viral content trends and patterns
- Audience engagement strategies
- Content optimization techniques
- Hashtag strategies and trending topics

Be direct, concise, and actionable. When users ask for modifications to previous content, acknowledge what you're changing and why."""

    # Add continuation-specific context
    if user_context.get("is_continuation"):
        topic = user_context.get("conversation_topic", "the previous topic")
        base_prompt += f"\n\nCONTINUITY ALERT: The user is continuing/modifying our discussion about {topic}. Reference and build upon what we've already discussed."
        
        # Add specific reference to last content
        last_content_ref = user_context.get("last_content_reference")
        if last_content_ref:
            last_idea = last_content_ref.get("data", {}).get("idea", "")
            base_prompt += f"\n\nLAST CONTENT DISCUSSED: {last_idea} - The user wants to modify or build upon this."
    
    # Add content generation count context
    content_count = user_context.get("content_generation_count", 0)
    if content_count > 0:
        base_prompt += f"\n\nCONVERSATION CONTEXT: This is the {content_count + 1} content idea in our conversation. Build upon the established themes and preferences."
    
    # Add platform-specific information
    selected_platforms = user_context.get("selected_platforms", [])
    if selected_platforms:
        platform_list = ", ".join(selected_platforms)
        base_prompt += f"\n\nTARGET PLATFORMS: {platform_list}"
    
    # Add trending content information
    trending_content = user_context.get("trending_content", [])
    if trending_content:
        base_prompt += f"\n\nTRENDING CONTEXT: User has {len(trending_content)} trending videos for reference."
    
    # Add intent-specific context
    current_intent = user_context.get("current_intent")
    if current_intent == "content_modification":
        base_prompt += "\n\nUSER INTENT: The user wants to modify/improve previous content. Focus on the specific changes they're requesting."
    elif current_intent == "content_generation":
        base_prompt += "\n\nUSER INTENT: The user wants new content generation."
    
    return base_prompt

def should_generate_content_check(response_content: str, user_context: Dict[str, Any]) -> bool:
    """Check if the response should trigger content generation with better modification detection."""
    user_input = user_context.get("last_user_input", "").lower()
    current_intent = user_context.get("current_intent", "")
    
    logger.info(f"should_generate_content_check: user_input='{user_input}', current_intent='{current_intent}'")
    
    # Always generate content for modification requests
    if current_intent == "content_modification":
        logger.info("should_generate_content_check: Returning True (content_modification)")
        return True
    
    # Always generate content for content generation requests
    if current_intent == "content_generation":
        logger.info("should_generate_content_check: Returning True (content_generation)")
        return True
    
    # Keywords that explicitly request content generation
    content_request_keywords = [
        "create content", "generate content", "make content", "content idea",
        "video idea", "post idea", "create a video", "make a video",
        "content strategy", "viral idea", "trending content", "morning coffee",
        "coffee", "workout", "cooking", "dance", "transformation", "routine"
    ]
    
    # Check if user explicitly requested content
    if any(keyword in user_input for keyword in content_request_keywords):
        return True
    
    # Check if this is a continuation of a content-related conversation
    if user_context.get("is_continuation") and user_context.get("conversation_topic") != "general":
        return True
    
    # Check if there's content history and user is asking for more
    if user_context.get("content_history") and len(user_context.get("content_history", [])) > 0:
        # If user has previous content and is asking for modifications or more content
        modification_keywords = ["more", "different", "another", "chaotic", "funnier", "better"]
        if any(keyword in user_input for keyword in modification_keywords):
            return True
    
    return False

def extract_content_prompt(response_content: str, user_context: Dict[str, Any]) -> str:
    """Extract a content generation prompt from the response with continuation context."""
    user_input = user_context.get("last_user_input", "")
    
    # Base prompt
    enhanced_prompt = f"Create viral social media content based on this request: {user_input}"
    
    # Add continuation context
    if user_context.get("is_continuation"):
        enhanced_prompt += f"\n\nIMPORTANT: This is a modification of previous content about {user_context.get('conversation_topic', 'the previous topic')}"
        
        last_content_ref = user_context.get("last_content_reference")
        if last_content_ref:
            last_idea = last_content_ref.get("data", {}).get("idea", "")
            last_structure = last_content_ref.get("data", {}).get("videoStructure", "")
            enhanced_prompt += f"\n\nPREVIOUS CONTENT TO MODIFY:\nIdea: {last_idea}\nStructure: {last_structure}"
            enhanced_prompt += f"\n\nUser wants to modify this content. Apply their specific requested changes while maintaining the core concept."
    
    # Add platform context
    selected_platforms = user_context.get("selected_platforms", [])
    if selected_platforms:
        enhanced_prompt += f"\n\nOptimize for: {', '.join(selected_platforms)}"
    
    return enhanced_prompt

def extract_content_from_text(text: str) -> Dict[str, Any]:
    """Extract structured content from text when JSON parsing fails."""
    content = {
        "idea": "Content idea extracted from conversation",
        "videoStructure": "Video structure based on the discussion",
        "caption": "Engaging caption for the content",
        "hashtags": ["viral", "trending", "content"]
    }
    
    lines = text.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect sections
        if "idea" in line.lower() and ":" in line:
            current_section = "idea"
            content["idea"] = line.split(":", 1)[1].strip()
        elif "structure" in line.lower() and ":" in line:
            current_section = "videoStructure"
            content["videoStructure"] = line.split(":", 1)[1].strip()
        elif "caption" in line.lower() and ":" in line:
            current_section = "caption"
            content["caption"] = line.split(":", 1)[1].strip()
        elif "hashtag" in line.lower() and ":" in line:
            current_section = "hashtags"
            hashtags = [word.strip('#') for word in line.split() if word.startswith('#')]
            if hashtags:
                content["hashtags"] = hashtags
        elif current_section and not any(keyword in line.lower() for keyword in ["idea", "structure", "caption", "hashtag"]):
            # Continue previous section
            if current_section in content:
                content[current_section] += " " + line
    
    return content

def process_conversation(user_input: str, conversation_history: List[Dict] = [], user_context: Optional[Dict] = None) -> Dict[str, Any]:
    """Process a conversation using the state graph with proper state preservation."""
    try:
        # Convert conversation history to LangChain messages
        langchain_messages = []
        for msg in conversation_history:
            if msg.get("type") == "user":
                langchain_messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("type") == "assistant":
                langchain_messages.append(AIMessage(content=msg.get("content", "")))
        
        # Add current user input
        langchain_messages.append(HumanMessage(content=user_input))
        
        # Initialize conversation state with proper context preservation
        initial_state = {
            "messages": langchain_messages,
            "user_context": user_context if user_context is not None else {},
            "content_history": user_context.get("content_history", []) if user_context else [],
            "conversation_summary": user_context.get("conversation_summary") if user_context else None
        }
        
        # Create and run the conversation graph
        graph = create_conversation_graph()
        result = graph.invoke(initial_state)
        
        # Extract the final response
        final_messages = result.get("messages", [])
        if final_messages:
            final_response = final_messages[-1]
        else:
            final_response = AIMessage(content="I'm having trouble processing your request.")
        
        # Prepare response data with complete context preservation
        response_data = {
            "success": True,
            "response": final_response.content,
            "structured_content": final_response.additional_kwargs.get("structured_content") if hasattr(final_response, 'additional_kwargs') and final_response.additional_kwargs else None,
            "conversation_context": result.get("user_context", {}),
            "content_history": result.get("content_history", [])
        }
        
        logger.info(f"process_conversation: Returning structured_content={response_data['structured_content']}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error in process_conversation: {e}")
        return {
            "success": False,
            "error": str(e),
            "response": "I'm having trouble processing your request. Please try again.",
            "structured_content": None,
            "conversation_context": user_context if user_context else {},
            "content_history": user_context.get("content_history", []) if user_context else []
        }