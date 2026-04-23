#!/usr/bin/env python3
"""
Simple test script for ai_screening.py functions
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from jobs.ai_screening import (
    calculate_match_score,
    get_score_label,
    clean_text,
    extract_tech_skills,
    tfidf_score,
    skill_overlap_score,
)

def test_functions():
    print("Testing AI Screening Functions")
    print("=" * 40)

    # Test clean_text
    print("\n1. Testing clean_text:")
    test_text = "Hello, World! This is a TEST with 123 numbers."
    cleaned = clean_text(test_text)
    print(f"Original: {test_text}")
    print(f"Cleaned:  {cleaned}")

    # Test extract_tech_skills
    print("\n2. Testing extract_tech_skills:")
    job_desc = "We need a Python developer with Django and React experience"
    skills = extract_tech_skills(job_desc)
    print(f"Text: {job_desc}")
    print(f"Skills found: {skills}")

    # Test calculate_match_score
    print("\n3. Testing calculate_match_score:")
    job = "Python Django React developer with SQL and Docker experience"
    candidate = "Python Django React SQL Docker developer 3 years experience"
    score = calculate_match_score(job, candidate)
    print(f"Job: {job}")
    print(f"Candidate: {candidate}")
    print(f"Match Score: {score}")

    # Test get_score_label
    print("\n4. Testing get_score_label:")
    label = get_score_label(score)
    print(f"Score: {score}")
    print(f"Label: {label}")

    # Test skill_overlap_score
    print("\n5. Testing skill_overlap_score:")
    overlap = skill_overlap_score(job, candidate)
    print(f"Job skills: {extract_tech_skills(job)}")
    print(f"Candidate skills: {extract_tech_skills(candidate)}")
    print(f"Overlap score: {overlap}")

    # Test tfidf_score
    print("\n6. Testing tfidf_score:")
    tfidf = tfidf_score(clean_text(job), clean_text(candidate))
    print(f"TF-IDF similarity: {tfidf}")

if __name__ == "__main__":
    test_functions()