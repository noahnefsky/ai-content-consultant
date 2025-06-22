import json
import re
from typing import Dict, Optional


def extract_content_from_text(text: str) -> dict:
    """Extract structured content from plain text response"""
    lines = text.split('\n')
    content = {
        "idea": "",
        "videoStructure": "",
        "caption": "",
        "hashtags": []
    }
    
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for section headers
        if "idea:" in line.lower() or "concept:" in line.lower():
            current_section = "idea"
            content["idea"] = line.split(":", 1)[1].strip() if ":" in line else ""
        elif "video structure:" in line.lower() or "structure:" in line.lower():
            current_section = "videoStructure"
            content["videoStructure"] = line.split(":", 1)[1].strip() if ":" in line else ""
        elif "caption:" in line.lower():
            current_section = "caption"
            content["caption"] = line.split(":", 1)[1].strip() if ":" in line else ""
        elif "hashtags:" in line.lower():
            current_section = "hashtags"
            hashtag_text = line.split(":", 1)[1].strip() if ":" in line else ""
            # Extract hashtags from text
            hashtags = [tag.strip() for tag in hashtag_text.split() if tag.startswith("#")]
            content["hashtags"] = hashtags
        elif current_section and line:
            # Continue adding to current section
            if current_section == "idea":
                content["idea"] += " " + line
            elif current_section == "videoStructure":
                content["videoStructure"] += " " + line
            elif current_section == "caption":
                content["caption"] += " " + line
            elif current_section == "hashtags":
                hashtags = [tag.strip() for tag in line.split() if tag.startswith("#")]
                content["hashtags"].extend(hashtags)
    
    return content


def extract_json_from_response(text: str) -> Optional[Dict]:
    """Extract JSON from the response text"""
    # Look for JSON code blocks first (```json ... ```)
    json_block_pattern = re.compile(r'```json\s*(\{.*?\})\s*```', re.DOTALL)
    match = json_block_pattern.search(text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Look for JSON objects in the text
    json_pattern = re.compile(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', re.DOTALL)
    matches = json_pattern.findall(text)
    
    for match in matches:
        try:
            return json.loads(match)
        except json.JSONDecodeError:
            continue
    
    return None