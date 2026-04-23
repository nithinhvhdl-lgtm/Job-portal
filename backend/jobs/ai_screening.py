from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pdfplumber
import re
import os


# ─────────────────────────────────────────────────────────────
# KNOWN TECH SKILLS DICTIONARY
# Used as a bonus layer on top of TF-IDF
# ─────────────────────────────────────────────────────────────

TECH_SKILLS = {
    # Languages
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby',
    'php', 'swift', 'kotlin', 'go', 'rust', 'scala', 'r',

    # Frontend
    'react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind',
    'bootstrap', 'redux', 'nextjs', 'gatsby',

    # Backend
    'django', 'flask', 'fastapi', 'nodejs', 'express', 'spring',
    'laravel', 'rails', 'graphql', 'rest', 'restful',

    # Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite',
    'oracle', 'firebase', 'dynamodb', 'elasticsearch',

    # Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
    'terraform', 'ansible', 'ci/cd', 'linux', 'nginx', 'git',
    'github', 'gitlab', 'bitbucket',

    # AI & Data
    'machine learning', 'deep learning', 'tensorflow', 'pytorch',
    'scikit-learn', 'pandas', 'numpy', 'opencv', 'nlp',
    'data science', 'neural network',

    # Mobile
    'flutter', 'react native', 'android', 'ios', 'xcode',

    # Other
    'figma', 'photoshop', 'ui', 'ux', 'agile', 'scrum',
    'microservices', 'websocket', 'oauth', 'jwt',
}


# ─────────────────────────────────────────────────────────────
# PDF TEXT EXTRACTION
# ─────────────────────────────────────────────────────────────

def extract_pdf_text(file_path: str) -> str:
    """
    Opens a PDF file and extracts all text from every page.

    Args:
        file_path: Absolute path to the PDF file on disk

    Returns:
        Plain string of all extracted text, or empty string on failure
    """
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
    except FileNotFoundError:
        print(f"[AI Screening] PDF not found: {file_path}")
        return ""
    except Exception as e:
        print(f"[AI Screening] PDF extraction error: {e}")
        return ""
    return text.strip()


# ─────────────────────────────────────────────────────────────
# TEXT CLEANING
# ─────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """
    Prepares raw text for TF-IDF processing.

    Steps:
        1. Lowercase everything
        2. Remove punctuation and special characters
        3. Collapse multiple spaces into one
        4. Strip leading/trailing whitespace

    Args:
        text: Raw input string

    Returns:
        Cleaned string ready for vectorization
    """
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)   # remove punctuation
    text = re.sub(r'\s+', ' ', text)        # collapse spaces
    return text.strip()


# ─────────────────────────────────────────────────────────────
# TECH SKILL EXTRACTION
# ─────────────────────────────────────────────────────────────

def extract_tech_skills(text: str) -> set:
    """
    Scans text and returns all known tech skills found in it.

    Args:
        text: Any text (job description or candidate profile)

    Returns:
        Set of matched skill strings
    """
    text_lower = text.lower()
    found = set()
    for skill in TECH_SKILLS:
        # Use word boundary to avoid partial matches
        # e.g. 'r' should not match inside 'react'
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.add(skill)
    return found


# ─────────────────────────────────────────────────────────────
# TFIDF COSINE SIMILARITY SCORE
# ─────────────────────────────────────────────────────────────

def tfidf_score(job_text: str, candidate_text: str) -> float:
    """
    Calculates how similar two pieces of text are using
    TF-IDF vectorization and cosine similarity.

    TF-IDF explained simply:
        - Words that appear often in THIS document but rarely
          in others are given higher weight (they are important)
        - Common words like 'the', 'is', 'and' are ignored
          automatically via stop_words='english'

    Cosine similarity explained simply:
        - Converts each text into a vector of numbers
        - Measures the angle between the two vectors
        - 1.0 = identical direction (perfect match)
        - 0.0 = perpendicular (nothing in common)

    Args:
        job_text:       Full job description + requirements
        candidate_text: Candidate skills + resume text + cover letter

    Returns:
        Float between 0.0 and 1.0
    """
    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',    # auto-removes common English words
            ngram_range=(1, 2),      # matches single words AND two-word phrases
            max_features=500,        # use only top 500 important terms
            sublinear_tf=True        # smooth term frequency (log scale)
        )

        # Fit vectorizer on both texts, then transform them
        tfidf_matrix = vectorizer.fit_transform([job_text, candidate_text])

        # Calculate cosine similarity between job (index 0) and candidate (index 1)
        similarity = cosine_similarity(
            tfidf_matrix[0:1],
            tfidf_matrix[1:2]
        )[0][0]

        return float(similarity)

    except ValueError as e:
        # Happens when texts are too short or empty after cleaning
        print(f"[AI Screening] TF-IDF error: {e}")
        return 0.0
    except Exception as e:
        print(f"[AI Screening] Unexpected error: {e}")
        return 0.0


# ─────────────────────────────────────────────────────────────
# TECH SKILL BONUS SCORE
# ─────────────────────────────────────────────────────────────

def skill_overlap_score(job_text: str, candidate_text: str) -> float:
    """
    Calculates what percentage of the job's required tech skills
    the candidate actually has.

    Formula:
        matched skills / total skills required by job

    Args:
        job_text:       Job description text
        candidate_text: Candidate profile text

    Returns:
        Float between 0.0 and 1.0
    """
    job_skills = extract_tech_skills(job_text)
    candidate_skills = extract_tech_skills(candidate_text)

    if not job_skills:
        return 0.0

    matched = job_skills & candidate_skills   # intersection
    return len(matched) / len(job_skills)


# ─────────────────────────────────────────────────────────────
# MAIN SCORING FUNCTION  ← This is what views.py calls
# ─────────────────────────────────────────────────────────────

def calculate_match_score(job_text: str, candidate_text: str) -> float:
    """
    Master function that combines TF-IDF similarity
    and tech skill overlap into a final 0–100 score.

    Weights:
        50% → TF-IDF cosine similarity (overall text match)
        50% → Tech skill overlap (specific skills match)

    Args:
        job_text:       Combined job title + description + requirements
        candidate_text: Combined skills + resume text + cover letter

    Returns:
        Float score from 0.0 to 100.0 (2 decimal places)

    Example:
        score = calculate_match_score(
            job_text="Python Django developer with React and MySQL",
            candidate_text="Python developer 3 years Django REST React"
        )
        # Returns something like 74.35
    """
    # Guard: return 0 if either input is empty
    if not job_text or not job_text.strip():
        return 0.0
    if not candidate_text or not candidate_text.strip():
        return 0.0

    # Clean both texts
    job_clean       = clean_text(job_text)
    candidate_clean = clean_text(candidate_text)

    # Calculate both scores independently
    tfidf   = tfidf_score(job_clean, candidate_clean)         # 0.0 to 1.0
    skills  = skill_overlap_score(job_text, candidate_text)   # 0.0 to 1.0

    # Weighted combination
    combined = (0.50 * tfidf) + (0.50 * skills)

    # Scale to 0–100 and round to 2 decimal places
    final_score = round(combined * 100, 2)

    # Safety clamp — never exceed 100
    return min(final_score, 100.0)


# ─────────────────────────────────────────────────────────────
# SCORE LABEL HELPER  ← Used by views.py for API response
# ─────────────────────────────────────────────────────────────

def get_score_label(score: float) -> dict:
    """
    Converts a numeric score into a human-readable label
    and a color string for the frontend to display.

    Args:
        score: Float between 0 and 100

    Returns:
        Dict with 'label' and 'color' keys

    Example:
        get_score_label(75.0)
        # Returns {"label": "Excellent Match", "color": "green"}
    """
    if score >= 70:
        return {"label": "Excellent Match", "color": "green"}
    elif score >= 50:
        return {"label": "Good Match",      "color": "blue"}
    elif score >= 30:
        return {"label": "Fair Match",      "color": "yellow"}
    else:
        return {"label": "Low Match",       "color": "red"}


# ─────────────────────────────────────────────────────────────
# RESUME FILE HANDLER  ← Called from views.py for file uploads
# ─────────────────────────────────────────────────────────────

def get_candidate_text_from_resume(resume_file, profile_skills: str = "", cover_letter: str = "") -> str:
    """
    Builds the full candidate text string by combining:
        1. Text extracted from uploaded PDF resume
        2. Skills listed on their profile
        3. Their cover letter text

    This combined text is then passed into calculate_match_score().

    Args:
        resume_file:    Django InMemoryUploadedFile (from request.FILES)
        profile_skills: Comma-separated skills string from Profile model
        cover_letter:   Plain text cover letter from form submission

    Returns:
        Single combined string of all candidate text
    """
    candidate_text = ""

    # 1. Extract text from PDF resume if provided
    if resume_file:
        temp_path = f"/tmp/{resume_file.name}"
        try:
            # Write uploaded file to disk temporarily
            with open(temp_path, 'wb') as f:
                for chunk in resume_file.chunks():
                    f.write(chunk)

            # Extract text from the saved PDF
            pdf_text = extract_pdf_text(temp_path)
            candidate_text += pdf_text + " "

        except Exception as e:
            print(f"[AI Screening] Resume file error: {e}")
        finally:
            # Always clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    # 2. Add profile skills
    if profile_skills:
        candidate_text += profile_skills + " "

    # 3. Add cover letter
    if cover_letter:
        candidate_text += cover_letter + " "

    return candidate_text.strip()