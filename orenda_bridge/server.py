#!/usr/bin/env python3
"""
Simple Flask server for the Hermeneutic Bridge API.

Deploy this to a free service like Render, Railway, or Fly.io.
"""

import os
from dataclasses import asdict
from flask import Flask, jsonify, request
from flask_cors import CORS
from hermeneutic_bridge import HermeneuticBridge
from hermeneutic_prompts import HermeneuticPrompts
from memory.profile_store import ProfileStore
from synthetic_engine import SyntheticResearchEngine

app = Flask(__name__)
# CORS: Allow all origins for now (update with specific domains in production)
# To restrict: CORS(app, origins=["https://your-domain.com"])
CORS(app, origins="*")  # Allow web app to call this API

# Initialize bridge (will be set up on first request)
bridge = None

# Lazy synthetic research engine
research_engine = None

# Initialize hermeneutic prompts system
prompt_system = HermeneuticPrompts(seed_stories_dir="./seed_stories")

# Initialize profile store
profile_store = ProfileStore()

def get_bridge():
    """Initialize and return the bridge with LLM client (Mistral or OpenAI)."""
    global bridge
    
    if bridge is None:
        # Check which provider to use
        provider = os.getenv("LLM_PROVIDER", "mistral").lower()
        model = os.getenv("LLM_MODEL", "")
        
        if provider == "openai" or model.startswith("gpt"):
            # Use OpenAI
            from openai import OpenAI
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")
            client = OpenAI(api_key=api_key)
            model = model or "gpt-4o"
            print(f"[bridge] Using OpenAI with model: {model}")
        else:
            # Use Mistral (default)
            from mistralai import Mistral
            api_key = os.getenv("MISTRAL_API_KEY")
            if not api_key:
                raise ValueError("MISTRAL_API_KEY environment variable not set")
            client = Mistral(api_key=api_key)
            # Default to large for better quality (was small)
            model = model or "mistral-large-latest"
            print(f"[bridge] Using Mistral with model: {model}")
        
        bridge = HermeneuticBridge(
            seeds_dir="./seeds",
            model=model,
            temperature=0.8
        )
        bridge.set_client(client)
    
    return bridge


def get_research_engine():
    """Lazy loader for the synthetic research engine."""
    global research_engine

    if research_engine is None:
        research_engine = SyntheticResearchEngine()

    return research_engine

@app.route('/')
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "orenda-bridge"})

@app.route('/warm-up', methods=['POST'])
def warm_up():
    """
    Run the hermeneutic bridge warm-up.
    
    Optional JSON body:
    {
        "max_turns": 5  // number of iterations (default: 5)
    }
    """
    try:
        data = request.get_json() or {}
        max_turns = data.get('max_turns', 3)  # Reduced default to avoid rate limits
        
        bridge = get_bridge()
        result = bridge.warm_up(max_turns=max_turns)
        
        return jsonify({
            "success": True,
            "seed_used": result['seed_used'],
            "summary": result['summary'],
            "messages_count": len(result['messages'])
        })
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Warm-up error: {error_details}")  # Log to server console
        return jsonify({
            "success": False,
            "error": str(e),
            "details": error_details if app.debug else None
        }), 500

@app.route('/warm-up', methods=['GET'])
def warm_up_get():
    """GET endpoint for warm-up (same as POST)."""
    return warm_up()

def analyze_user_style(conversation_history):
    """
    Analyze user's communication style from conversation history.
    Returns a style description like "fast and direct" or "slow and evasive".
    """
    if not conversation_history or len(conversation_history) < 2:
        return None
    
    # Get user messages only
    user_messages = [msg for msg in conversation_history if msg.get('role') == 'user']
    if len(user_messages) < 2:
        return None
    
    # Analyze patterns
    avg_length = sum(len(msg.get('content', '')) for msg in user_messages) / len(user_messages)
    has_questions = any('?' in msg.get('content', '') for msg in user_messages)
    has_ellipses = any('...' in msg.get('content', '') or '…' in msg.get('content', '') for msg in user_messages)
    is_direct = any(len(msg.get('content', '').split()) < 10 for msg in user_messages)
    
    # Determine style
    if avg_length < 20 and is_direct:
        return "fast and direct"
    elif avg_length > 50 or has_ellipses:
        return "slow and reflective"
    elif has_questions:
        return "curious and questioning"
    else:
        return "measured and thoughtful"

@app.route('/reload-seeds', methods=['POST'])
def reload_seeds():
    """Reload seed stories from directory (useful after adding new stories)."""
    try:
        prompt_system.reload_seed_stories()
        return jsonify({
            "success": True,
            "message": "Seed stories reloaded",
            "examples_count": len(prompt_system.seed_stories)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def _safe_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@app.route('/research/archetypes', methods=['GET'])
def research_archetypes():
    """Expose archetype summaries derived from ground-truth sessions."""
    try:
        limit = _safe_int(request.args.get('limit'), 5)
        engine = get_research_engine()
        archetypes = [
            asdict(profile) for profile in engine.generate_archetypes(max_archetypes=limit)
        ]
        return jsonify({
            "success": True,
            "count": len(archetypes),
            "archetypes": archetypes
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route('/research/analytics', methods=['GET'])
def research_analytics():
    """Return aggregate analytics over the ground-truth sessions."""
    try:
        engine = get_research_engine()
        return jsonify({
            "success": True,
            "analytics": engine.analyze_sessions()
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route('/research/methods', methods=['GET'])
def research_methods():
    """Provide method suggestions derived from ground-truth analytics."""
    try:
        limit = _safe_int(request.args.get('limit'), 4)
        engine = get_research_engine()
        methods = engine.generate_methods(max_methods=limit)
        return jsonify({
            "success": True,
            "count": len(methods),
            "methods": methods
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route('/research/reload', methods=['POST'])
def research_reload():
    """Reload the research engine (e.g., after adding new transcripts)."""
    try:
        global research_engine
        research_engine = SyntheticResearchEngine()
        return jsonify({"success": True, "message": "Research engine reloaded"})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


def _get_research_hints(user_message: str, limit: int = 2) -> str:
    """
    Fetch relevant hints from research engine (archetypes + methods).
    Returns a formatted string for injection into system prompt.
    """
    try:
        engine = get_research_engine()
        hints_parts = []
        
        # Get top archetype (if any)
        archetypes = engine.generate_archetypes(max_archetypes=1)
        if archetypes:
            arch = archetypes[0]
            keywords = ", ".join(arch.top_keywords[:5])
            hints_parts.append(f"Archetype pattern: {keywords}")
        
        # Get top method suggestions
        methods = engine.generate_methods(max_methods=limit)
        if methods:
            method_lines = []
            for method in methods[:limit]:
                moves = "; ".join(method.suggested_moves[:2])
                method_lines.append(f"{method.method}: {moves}")
            hints_parts.append("Method hints: " + " | ".join(method_lines))
        
        return "\n".join(hints_parts) if hints_parts else ""
    except Exception as e:
        print(f"[hints] Error fetching research hints: {e}")
        return ""


@app.route('/profile/<user_id>', methods=['GET'])
def get_profile(user_id: str):
    """Get user profile."""
    try:
        profile = profile_store.get_profile(user_id)
        if profile:
            return jsonify({"success": True, "profile": profile})
        else:
            return jsonify({"success": False, "error": "Profile not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/profile/<user_id>', methods=['POST'])
def save_profile(user_id: str):
    """Save or update user profile."""
    try:
        data = request.get_json() or {}
        success = profile_store.save_profile(
            user_id=user_id,
            chart=data.get('chart'),
            themes=data.get('themes'),
            tone_preference=data.get('tone_preference'),
            session_summary=data.get('session_summary')
        )
        if success:
            return jsonify({"success": True, "message": "Profile saved"})
        else:
            return jsonify({"success": False, "error": "Failed to save profile"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Generate hermeneutic dialogue response using Mistral.
    Uses hybrid prompt system: system prompt + few-shot seed stories.
    Includes relationship depth tracking and natural processing delay.
    
    JSON body:
    {
        "user_message": "...",
        "house_name": "...",
        "bridge_stance": "...",
        "relationship_depth": 0,  // Total exchanges
        "depth_level": "getting to know"  // Current depth level
    }
    """
    import time
    import random
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400
        
        user_message = data.get('user_message', '')
        house_name = data.get('house_name', '')
        bridge_stance = data.get('bridge_stance', '')
        relationship_depth = data.get('relationship_depth', 0)
        depth_level = data.get('depth_level', 'getting to know')
        conversation_history = data.get('conversation_history', [])
        user_id = data.get('user_id', 'default')  # Optional user ID for profile lookup
        
        if not user_message:
            return jsonify({"success": False, "error": "user_message required"}), 400
        
        # Natural processing delay (simulates thinking time)
        # Shorter for early exchanges, longer for deeper ones
        if relationship_depth <= 5:
            processing_delay = random.uniform(1.5, 3.0)  # 1.5-3s for early exchanges
        elif relationship_depth <= 15:
            processing_delay = random.uniform(2.5, 4.5)  # 2.5-4.5s for building rapport
        else:
            processing_delay = random.uniform(3.5, 6.0)  # 3.5-6s for deeper exchanges
        
        time.sleep(processing_delay)
        
        # Get bridge client
        bridge = get_bridge()
        
        # Build prompt with bridge stance context and relationship depth
        # house_name contains: "House Name: themes. voice description"
        house_context = house_name if house_name else ""
        bridge_stance_context = bridge_stance if bridge_stance else ""
        
        # Adjust prompt based on relationship depth
        depth_context = f"Relationship depth: {depth_level} ({relationship_depth} exchanges). "
        if relationship_depth <= 5:
            depth_context += "Keep responses LIGHT and SLOW. Surface-level observations only. NO questions. Keep it SHORT (2-3 lines max). Just notice, reflect, observe. Don't dive deep yet. This is the 'getting to know you' phase - take it slow."
        elif relationship_depth <= 15:
            depth_context += "Gradually deepening, but still building rapport. Can explore more, but keep it measured. Maximum ONE question per response, and only if it naturally emerges."
        else:
            depth_context += "Deep relationship established. Full mythic/archetypal depth appropriate. Give clean, accurate, specific interpretations of what their chart actually says - avoid generic phrases. Questions are rare - let observations stand on their own. Maximum ONE question per response."
        
        # Analyze user's communication style from conversation history
        user_style = analyze_user_style(conversation_history)
        style_context = ""
        if user_style:
            style_context = f"\n\nUser communication style: {user_style}. Match their pace and style - if they're direct, be direct. If they're slow/evasive, slow down and be more gentle."
        
        # Get research hints (archetypes + methods) - lightweight, no embeddings
        research_hints = _get_research_hints(user_message, limit=2)
        
        # Use hermeneutic prompt system with few-shot examples + hints
        messages = prompt_system.build_messages(
            user_message=user_message,
            house_context=house_context,
            bridge_stance=bridge_stance_context,
            conversation_history=conversation_history,
            hints=research_hints
        )
        
        # Add depth context and style context to system message
        if messages and messages[0]['role'] == 'system':
            messages[0]['content'] += f"\n\n{depth_context}"
            if style_context:
                messages[0]['content'] += style_context
        
        response = bridge.llm_client.chat.complete(
            model=bridge.model,
            messages=messages,
            temperature=bridge.temperature,
        )
        
        reply = response.choices[0].message.content
        
        return jsonify({
            "success": True,
            "response": reply
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # For local testing
    port = int(os.getenv('PORT', 5000))
    print("\n" + "=" * 60)
    print("Orenda Bridge Server Starting...")
    print("=" * 60)
    print(f"Server running on: http://localhost:{port}")
    print(f"Also available at: http://127.0.0.1:{port}")
    print("=" * 60)
    print("Server is ready! Waiting for requests...")
    print("   (Press Ctrl+C to stop)")
    print("=" * 60 + "\n")
    app.run(host='0.0.0.0', port=port, debug=False)  # Disable debug to avoid PIN prompt

