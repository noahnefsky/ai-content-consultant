import os
import json
import logging
import re
from pathlib import Path
from typing import List, Tuple, Dict, Any
import assemblyai as aai
from moviepy.editor import VideoFileClip
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Set the API keys
aai.settings.api_key = "6566dcb906524974a08e82d9f62510f0"
client = genai.Client(api_key="AIzaSyAqUYPSYeSqW2_o4kATsDfIAiXwF178B8c")

class AssemblyError(RuntimeError):
    """Raised when AssemblyAI returns an error status."""


def transcribe(video_path: str | Path, cfg: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """High‑level helper: transcribe audio/video file and return results."""
    video_path = Path(video_path)
    logger.info("Transcribing %s with AssemblyAI…", video_path)
    
    # Create transcription config with default options
    config = aai.TranscriptionConfig(
        speaker_labels=True,
        auto_highlights=True,
        summarization=True,
        summary_type=aai.SummarizationType.bullets,
        summary_model=aai.SummarizationModel.informative
    )
    
    # Update config with any extra options
    if cfg:
        for key, value in cfg.items():
            if hasattr(config, key):
                setattr(config, key, value)
            else:
                logger.warning("Unknown config option: %s", key)
    
    # Create transcriber and transcribe
    transcriber = aai.Transcriber(config=config)
    transcript = transcriber.transcribe(str(video_path))
    
    # Check for errors
    if transcript.status == aai.TranscriptStatus.error:
        raise AssemblyError(f"Transcription failed: {transcript.error}")
    
    logger.info("Transcription completed – %s words", len(transcript.words or []))
    
    # Convert to dictionary format similar to original
    result = {
        "id": transcript.id,
        "status": transcript.status.value,
        "text": transcript.text,
        "words": [
            {
                "text": word.text,
                "start": word.start,
                "end": word.end,
                "confidence": word.confidence,
                "speaker": getattr(word, 'speaker', None)
            } for word in (transcript.words or [])
        ],
        "utterances": [
            {
                "text": utterance.text,
                "start": utterance.start,
                "end": utterance.end,
                "confidence": utterance.confidence,
                "speaker": utterance.speaker
            } for utterance in (transcript.utterances or [])
        ] if hasattr(transcript, 'utterances') and transcript.utterances else [],
        "auto_highlights": [
            {
                "text": highlight.text,
                "count": highlight.count,
                "rank": highlight.rank,
                "timestamps": [
                    {
                        "start": ts.start,
                        "end": ts.end
                    } for ts in highlight.timestamps
                ]
            } for highlight in (transcript.auto_highlights.results if transcript.auto_highlights and transcript.auto_highlights.results else [])
        ],
        "summary": transcript.summary if hasattr(transcript, 'summary') else None
    }
    
    return result


def extract_json_from_response(text: str) -> str:
    """Extract JSON from markdown code blocks or return the text as-is."""
    # Look for JSON in markdown code blocks
    json_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
    match = re.search(json_pattern, text, re.DOTALL)
    
    if match:
        return match.group(1).strip()
    
    # If no code block found, try to find JSON object in the text
    json_object_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    match = re.search(json_object_pattern, text, re.DOTALL)
    
    if match:
        return match.group(0).strip()
    
    # Return the original text if no JSON found
    return text.strip()


def _call_llm(transcript_text: str, target_platform: str = "tiktok") -> Dict[str, Any]:
    """Use Gemini to analyze transcript and select engaging clips for social media.
    
    Args:
        transcript_text: The full transcript text from AssemblyAI
        target_platform: The target platform (tiktok, instagram, twitter)
    
    Returns:
        Dict with clips array and caption
    """
    system_prompt = f"""You are an expert content strategist specializing in viral {target_platform} content.

Given this transcript, analyze it and select the 2-3 most engaging 5-15 second highlights that would work well for {target_platform}.

Consider:
- Hook moments that grab attention quickly
- Emotional peaks or surprising revelations
- Clear, punchy statements that work without context
- {target_platform}-specific content patterns and trends

Return ONLY valid JSON in this exact format:
{{
    "clips": [
        {{"start": float, "end": float}},
        {{"start": float, "end": float}}
    ],
    "caption": "Engaging caption optimized for {target_platform}"
}}

The start and end times should be in seconds from the video timeline."""

    try:
        logger.info(f"Calling Gemini for {target_platform} with transcript length: {len(transcript_text)}")
        
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=transcript_text,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        
        logger.info(f"Gemini response received: {response.text[:100] if response.text else 'None'}...")
        
        if not response.text:
            raise ValueError("Empty response from Gemini")
        
        # Extract JSON from the response (handle markdown code blocks)
        json_text = extract_json_from_response(response.text)
        logger.info(f"Extracted JSON: {json_text[:100]}...")
        
        # Parse the JSON response
        result = json.loads(json_text)
        
        # Validate the response structure
        if "clips" not in result or "caption" not in result:
            raise ValueError("Invalid response structure from Gemini")
        
        logger.info(f"Successfully parsed Gemini response for {target_platform}")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        logger.error(f"Raw response: {response.text if response.text else 'None'}")
        # Fallback to default response
        return {
            "clips": [
                {"start": 10.0, "end": 25.0},
                {"start": 70.0, "end": 90.0},
            ],
            "caption": f"Amazing moments from this {target_platform} video! 🚀",
        }
    except Exception as e:
        logger.error(f"Error calling Gemini: {e}")
        # Fallback to default response
        return {
            "clips": [
                {"start": 10.0, "end": 25.0},
                {"start": 70.0, "end": 90.0},
            ],
            "caption": f"Amazing moments from this {target_platform} video! 🚀",
        }


def crop_video(source_path: str | Path, clips: List[Tuple[float, float]], output_dir: str | Path) -> List[Path]:
    """Cut `clips` (each (start, end) in seconds) from `source_path` into separate mp4s."""
    source_path = Path(source_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    outs = []
    with VideoFileClip(str(source_path)) as vid:
        for i, (start, end) in enumerate(clips, 1):
            sub = vid.subclip(start, end)
            out_file = output_dir / f"clip_{i}_{int(start)}_{int(end)}.mp4"
            logger.info("Writing %s (%s→%s) …", out_file.name, start, end)
            sub.write_videofile(str(out_file), codec="libx264", audio_codec="aac", logger=None)
            outs.append(out_file)
    return outs


def generate_highlight_reel(transcript_json: Dict[str, Any], source_video: str | Path, target_platform: str = "tiktok", out_dir: str | Path = "out") -> Dict[str, Any]:
    """Public API: given AssemblyAI JSON + video path → cropped clips + caption.
    
    Args:
        transcript_json: AssemblyAI transcript JSON
        source_video: Path to source video file
        target_platform: Target platform (tiktok, instagram, twitter)
        out_dir: Output directory for generated clips
    
    Returns:
        Dict with caption and clips array
    """
    text = transcript_json.get("text", "")
    llm_resp = _call_llm(text, target_platform)

    # Process all clips from LLM response
    clips: List[Tuple[float, float]] = []
    if llm_resp.get("clips"):
        clips = [(c["start"], c["end"]) for c in llm_resp["clips"]]
    
    out_files = crop_video(source_video, clips, out_dir) if clips else []

    return {
        "caption": llm_resp["caption"],
        "clips": [str(p) for p in out_files],
        "platform": target_platform,
        "transcript_length": len(text),
        "clips_count": len(clips)
    }


def process_video(video_path: str | Path, target_platform: str = "tiktok", output_dir: str | Path = "out") -> Dict[str, Any]:
    """Complete video processing pipeline: transcribe → analyze → crop → return results.
    
    Args:
        video_path: Path to the source video file
        target_platform: Target platform for optimization
        output_dir: Directory to save the generated clips
        
    Returns:
        A dictionary containing the results of the video processing.
    """
    try:
        # Step 1: Transcribe the video
        transcript_json = transcribe(video_path)
        
        # Step 2: Generate highlight reel
        result = generate_highlight_reel(
            transcript_json=transcript_json,
            source_video=video_path,
            target_platform=target_platform,
            out_dir=output_dir
        )
        
        # Add transcript to the final result
        result["transcript"] = transcript_json.get("text", "")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in video processing pipeline: {e}", exc_info=True)
        raise RuntimeError(f"Video processing failed: {e}") 