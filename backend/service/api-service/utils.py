import json
import re
from typing import Dict, Optional


def clean_text(text: str) -> str:
    """Remove surrounding quotes, commas, and extra whitespace from text"""
    if not text:
        return ""
    
    # Remove surrounding quotes (single or double) - handle multiple layers
    text = text.strip()
    while ((text.startswith('"') and text.endswith('"')) or 
           (text.startswith("'") and text.endswith("'"))):
        text = text[1:-1].strip()
    
    # Remove leading/trailing commas and periods
    text = text.strip(',.')
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


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
            raw_content = line.split(":", 1)[1].strip() if ":" in line else ""
            content["idea"] = clean_text(raw_content)
        elif "video structure:" in line.lower() or "structure:" in line.lower():
            current_section = "videoStructure"
            raw_content = line.split(":", 1)[1].strip() if ":" in line else ""
            content["videoStructure"] = clean_text(raw_content)
        elif "caption:" in line.lower():
            current_section = "caption"
            raw_content = line.split(":", 1)[1].strip() if ":" in line else ""
            content["caption"] = clean_text(raw_content)
        elif "hashtags:" in line.lower():
            current_section = "hashtags"
            hashtag_text = line.split(":", 1)[1].strip() if ":" in line else ""
            # Extract hashtags from text and clean each one
            hashtags = [clean_text(tag.strip()) for tag in hashtag_text.split() if tag.startswith("#")]
            content["hashtags"] = [tag for tag in hashtags if tag]  # Remove empty tags
        elif current_section and line:
            # Continue adding to current section
            if current_section == "idea":
                content["idea"] += " " + clean_text(line)
            elif current_section == "videoStructure":
                content["videoStructure"] += " " + clean_text(line)
            elif current_section == "caption":
                content["caption"] += " " + clean_text(line)
            elif current_section == "hashtags":
                hashtags = [clean_text(tag.strip()) for tag in line.split() if tag.startswith("#")]
                content["hashtags"].extend([tag for tag in hashtags if tag])  # Remove empty tags
    
    # Final cleanup of all text fields
    content["idea"] = clean_text(content["idea"])
    content["videoStructure"] = clean_text(content["videoStructure"])
    content["caption"] = clean_text(content["caption"])
    
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