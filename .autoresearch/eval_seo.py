#!/usr/bin/env python3
"""
SEO Quality Eval Script for gettodayshoroscope.com
Scores a landing page content file on 10 SEO criteria.
Outputs a single 0-100 score to stdout.

DO NOT MODIFY THIS FILE — it is integrity-checked by orchestrator.sh.
"""
import re
import sys
import os
import json
import math

# Target file is the SEO content config
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TARGET_FILE = os.environ.get("AUTORESEARCH_TARGET", os.path.join(SCRIPT_DIR, "seo-content.json"))

def load_content():
    """Load the SEO content JSON file."""
    with open(TARGET_FILE, 'r') as f:
        return json.load(f)

def score_title(title: str) -> float:
    """Score the page title (0-10)."""
    score = 0
    length = len(title)

    # Length: 50-60 chars is ideal for Google
    if 50 <= length <= 60:
        score += 4
    elif 40 <= length <= 70:
        score += 2
    elif length > 0:
        score += 1

    # Contains primary keyword
    primary_keywords = ["horoscope", "today", "daily"]
    for kw in primary_keywords:
        if kw.lower() in title.lower():
            score += 1.5

    # Doesn't start with brand name (keyword-first is better for new sites)
    if not title.lower().startswith("get today"):
        score += 1

    return min(score, 10)

def score_meta_description(desc: str) -> float:
    """Score the meta description (0-10)."""
    score = 0
    length = len(desc)

    # Length: 150-160 chars is ideal
    if 150 <= length <= 160:
        score += 3
    elif 130 <= length <= 170:
        score += 2
    elif length > 50:
        score += 1

    # Contains action words / CTAs
    action_words = ["discover", "find", "read", "get", "check", "explore", "see", "learn", "unlock"]
    for word in action_words:
        if word.lower() in desc.lower():
            score += 0.5
            break

    # Contains primary keywords
    keywords = ["horoscope", "today", "daily", "zodiac", "sign"]
    kw_count = sum(1 for kw in keywords if kw.lower() in desc.lower())
    score += min(kw_count * 1.0, 3)

    # Contains emotional/curiosity trigger
    triggers = ["what the stars", "in store", "guidance", "insight", "cosmic", "reveal",
                "destiny", "forecast", "prediction", "energy", "aligned", "universe"]
    for trigger in triggers:
        if trigger.lower() in desc.lower():
            score += 0.5
            break

    # Ends with a period or complete thought (not truncated)
    if desc.rstrip().endswith(('.', '!', '?')):
        score += 1

    return min(score, 10)

def score_h1(h1: str) -> float:
    """Score the main heading (0-10)."""
    score = 0

    # Not empty
    if not h1.strip():
        return 0

    # Contains primary keyword
    if "horoscope" in h1.lower():
        score += 3

    # Contains "today" or current date reference
    if any(w in h1.lower() for w in ["today", "daily", "2026", "april"]):
        score += 2

    # Length: 20-70 chars
    length = len(h1)
    if 20 <= length <= 70:
        score += 2
    elif length > 0:
        score += 1

    # Unique/compelling (not generic)
    generic_phrases = ["welcome to", "home page", "main page"]
    if not any(g in h1.lower() for g in generic_phrases):
        score += 1

    # Contains differentiator (philosophical, mindful, spiritual, etc.)
    differentiators = ["philosophical", "mindful", "spiritual", "guidance", "reflection",
                       "wisdom", "insight", "cosmic", "soul", "awareness"]
    for d in differentiators:
        if d.lower() in h1.lower():
            score += 2
            break

    return min(score, 10)

def score_intro_copy(intro: str) -> float:
    """Score the intro/hero copy (0-15)."""
    score = 0
    words = intro.split()
    word_count = len(words)

    # Word count: 50-150 words ideal for above-fold
    if 50 <= word_count <= 150:
        score += 3
    elif 30 <= word_count <= 200:
        score += 2
    elif word_count > 10:
        score += 1

    # Contains primary keywords naturally
    keywords = ["horoscope", "zodiac", "daily", "today", "sign", "stars", "astrology"]
    kw_count = sum(1 for kw in keywords if kw.lower() in intro.lower())
    score += min(kw_count * 1.0, 4)

    # Readability: average sentence length < 20 words
    sentences = re.split(r'[.!?]+', intro)
    sentences = [s.strip() for s in sentences if s.strip()]
    if sentences:
        avg_sent_len = sum(len(s.split()) for s in sentences) / len(sentences)
        if avg_sent_len <= 20:
            score += 2
        elif avg_sent_len <= 25:
            score += 1

    # Contains a value proposition or unique angle
    value_phrases = ["philosophical", "mindful", "reflection", "not prediction",
                     "self-awareness", "guidance", "grounded", "wisdom", "unlike",
                     "different", "unique", "beyond", "deeper"]
    for phrase in value_phrases:
        if phrase.lower() in intro.lower():
            score += 1
            break

    # Contains social proof or credibility signals
    credibility = ["thousands", "daily readers", "trusted", "expert", "powered by",
                   "based on", "rooted in", "inspired by"]
    for cred in credibility:
        if cred.lower() in intro.lower():
            score += 1
            break

    # Has a clear CTA or next step
    ctas = ["choose your sign", "select your sign", "read your", "find your",
            "discover your", "scroll down", "get started", "explore"]
    for cta in ctas:
        if cta.lower() in intro.lower():
            score += 2
            break

    return min(score, 15)

def score_sign_descriptions(signs: list) -> float:
    """Score the zodiac sign card descriptions (0-15)."""
    if not signs:
        return 0

    score = 0
    total_word_count = 0

    for sign_data in signs:
        desc = sign_data.get("description", "")
        words = desc.split()
        total_word_count += len(words)

        # Each description should be 20-50 words
        if 20 <= len(words) <= 50:
            score += 0.5

    # Total word count across all signs (more content = better for SEO)
    if total_word_count >= 300:
        score += 4
    elif total_word_count >= 200:
        score += 2
    elif total_word_count >= 100:
        score += 1

    # Keyword variety across descriptions
    all_text = " ".join(s.get("description", "") for s in signs).lower()
    seo_keywords = ["horoscope", "today", "energy", "guidance", "love", "career",
                    "zodiac", "stars", "forecast", "sign", "daily"]
    kw_variety = sum(1 for kw in seo_keywords if kw in all_text)
    score += min(kw_variety * 0.5, 3)

    return min(score, 15)

def score_internal_linking(content: dict) -> float:
    """Score internal linking signals (0-10)."""
    score = 0

    # Has links to individual sign pages
    sign_links = content.get("sign_links", [])
    if len(sign_links) >= 12:
        score += 4
    elif len(sign_links) >= 6:
        score += 2

    # Has links to related content (weekly, monthly, compatibility)
    related_links = content.get("related_links", [])
    if len(related_links) >= 3:
        score += 3
    elif len(related_links) >= 1:
        score += 1

    # Has FAQ section (rich snippets opportunity)
    faqs = content.get("faqs", [])
    if len(faqs) >= 3:
        score += 3
    elif len(faqs) >= 1:
        score += 1

    return min(score, 10)

def score_cta_elements(content: dict) -> float:
    """Score call-to-action and conversion elements (0-10)."""
    score = 0

    # Has email signup CTA
    if content.get("email_cta"):
        score += 3
        # Email CTA has compelling copy (not just "subscribe")
        cta_text = content.get("email_cta", "").lower()
        if any(w in cta_text for w in ["free", "daily", "inbox", "morning", "delivered"]):
            score += 1

    # Has push notification prompt
    if content.get("push_prompt"):
        score += 2

    # Has social sharing buttons
    if content.get("social_share"):
        score += 2

    # Has a secondary CTA (app download, bookmark, etc.)
    if content.get("secondary_cta"):
        score += 2

    return min(score, 10)

def score_content_freshness(content: dict) -> float:
    """Score freshness signals (0-10)."""
    score = 0

    # Contains today's date or "today"
    today_signals = content.get("freshness_signals", [])
    if len(today_signals) >= 2:
        score += 4
    elif len(today_signals) >= 1:
        score += 2

    # Has a "last updated" or "today's date" element
    if content.get("shows_date"):
        score += 3

    # Content references current astrological events
    if content.get("current_events"):
        score += 3

    return min(score, 10)

def score_schema_markup(content: dict) -> float:
    """Score structured data / schema (0-10)."""
    score = 0

    schemas = content.get("schemas", [])
    schema_types = [s.lower() for s in schemas]

    # WebSite schema
    if "website" in schema_types:
        score += 2

    # Article or CreativeWork schema for horoscope content
    if any(t in schema_types for t in ["article", "creativework", "webpage"]):
        score += 3

    # FAQ schema (rich snippet opportunity)
    if "faqpage" in schema_types:
        score += 3

    # BreadcrumbList
    if "breadcrumblist" in schema_types:
        score += 2

    return min(score, 10)

def main():
    try:
        content = load_content()
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading content: {e}", file=sys.stderr)
        sys.exit(1)

    # Calculate all scores
    scores = {
        "title": score_title(content.get("title", "")),
        "meta_description": score_meta_description(content.get("meta_description", "")),
        "h1": score_h1(content.get("h1", "")),
        "intro_copy": score_intro_copy(content.get("intro_copy", "")),
        "sign_descriptions": score_sign_descriptions(content.get("sign_descriptions", [])),
        "internal_linking": score_internal_linking(content),
        "cta_elements": score_cta_elements(content),
        "content_freshness": score_content_freshness(content),
        "schema_markup": score_schema_markup(content),
    }

    # Weighted total (out of 100)
    total = sum(scores.values())

    # Output ONLY the score as a single number
    print(f"{total:.2f}")

if __name__ == "__main__":
    main()
