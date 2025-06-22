#!/usr/bin/env python3
"""
Test script to verify conversation state maintenance.
"""

import json
from conversation_graph import process_conversation

def test_conversation_state():
    """Test that conversation state is properly maintained."""
        
    # Test 1: Initial conversation
    result1 = process_conversation(
        user_input="I want to create viral content for TikTok",
        conversation_history=[],
        user_context={
            "selected_platforms": ["TikTok"],
            "trending_content": []
        }
    )
    
    # Test 2: Follow-up conversation with previous context
    conversation_history = [
        {"type": "user", "content": "I want to create viral content for TikTok"},
        {"type": "assistant", "content": result1['response']}
    ]
    
    result2 = process_conversation(
        user_input="Can you give me another idea?",
        conversation_history=conversation_history,
        user_context=result1['conversation_context']
    )
    
    result3 = process_conversation(
        user_input="Generate a viral content idea for me",
        conversation_history=conversation_history,
        user_context=result2['conversation_context']
    )


if __name__ == "__main__":
    test_conversation_state() 