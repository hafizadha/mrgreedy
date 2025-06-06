# StelginsHR - Revolutionizing Talent Acquisition with AI
*Empowering recruiters with intelligent automation.*

![StelginsHR](https://github.com/user-attachments/assets/c77a3f9b-4f6e-4699-abca-c16297b030bc)

---

## 🚨 The Problem

Traditional recruitment is broken. Recruiters and hiring managers face significant challenges that slow down hiring and introduce bias. We're tackling three core issues:

![StelginsHR (1)](https://github.com/user-attachments/assets/b9c9bbd3-df42-4e28-a37c-8bb9f033b28c)


### 🤯 Overwhelmed by Volume
Recruiters are drowning in hundreds of applications for a single opening, many of which are spam, duplicates, or low-quality AI-generated fakes.

### ❌ Risk of Missing Talent & Bad Hires
Rigid keyword-matching filters out good candidates who phrase their experience differently, leading to missed opportunities.

### 📄 Diverse Formatting of Data
Candidate information arrives in multiple formats and layouts, making traditional parsing difficult and inconsistent.

---

## ✨ Our Solution: StelginsHR

StelginsHR is an AI-powered Applicant Tracking System (ATS) that understands candidates beyond keywords.

![StelginsHR (2)](https://github.com/user-attachments/assets/6d5a741b-cc0a-424b-b53f-b9d33dd0692c)


Our platform automates tedious recruitment tasks, enabling HR teams to focus on connecting with qualified people.

---

## 🚀 Key Features

### 1. AI-Driven Application Filtering

![image](https://github.com/user-attachments/assets/c91eb48c-2b90-41f3-8547-c1adc5d53daa)


- Detects and isolates irrelevant or spammy submissions.
- Filters out bot-submitted entries.
- Significantly reduces manual screening workload.

---

### 2. Intelligent Candidate Ranking & Portfolio Analysis

![image](https://github.com/user-attachments/assets/e35d7cd2-82c4-47c4-8445-7d9a96d34826)

- Uses semantic similarity to rank candidates by relevance.
- Evaluates resumes and attached portfolios holistically.
- Produces a clear, ranked shortlist of top-fit candidates.

---

### 3. Actionable Application Insights

![image](https://github.com/user-attachments/assets/6d05692a-51e8-41c8-ad80-8a146123458a)

- Visualizes education levels, skill trends, and application timing.
- Helps optimize job postings based on data patterns.

---

### 4. Tailored AI Chatbot

![image](https://github.com/user-attachments/assets/7fe028e5-ad76-4125-94d2-2ad8fb6bec76)

- Conversationally extracts insights from resumes.
- Adapts responses based on candidate profiles.
- Generates structured summaries to support hiring decisions.

---

## 🛠️ How It Works

### Resume Scoring Logic

![image](https://github.com/user-attachments/assets/4c8a0861-a4da-4fbd-a91d-db8163d2f19e)


```text
Final_Resume_Score = (Skill_Similarity + Experience_Similarity) / 2
```

- `Skill_Similarity`: Measures alignment between job-required and resume-listed skills.
- `Experience_Similarity`: Compares job role descriptions with candidate experience using NLP.
- Models used: Sentence-BERT and custom transformers from Hugging Face.


---

### 🔄 System Workflow

1. **Application Submission**  
   → User uploads resume, portfolio, and job preferences.

2. **Resume Parsing**  
   → Google Gemini extracts structured data.

3. **Spam & Fake Detection**  
   → Sapling AI filters low-quality or fake submissions.

4. **Resume Scoring**  
   → Semantic similarity models compute candidate relevance.

5. **Portfolio Analysis**  
   → Firecrawl fetches and analyzes external project links.

6. **Candidate Ranking & Dashboard Updates**  
   → Top applicants are ranked and insights visualized.

7. **Recruiter Interaction**  
   → AI Chatbot available for deep dives on any profile.

![image](https://github.com/user-attachments/assets/dd4530e1-ba95-4061-9ff7-87f231278bb6)

---

## 🧱 Technical Architecture

![image](https://github.com/user-attachments/assets/864036b4-787c-4d8f-8980-b85d57b7a158)

- **Frontend**: React, Next.js, TailwindCSS  
- **Backend**: FastAPI (Python)  
- **Database**: Supabase  
- **AI Services**:
  - Google Gemini: Resume parsing, Chatbot
  - Hugging Face: Sentence similarity models
  - Sapling: AI-generated/fake text detection
  - Firecrawl: Portfolio scraping and analysis

---

## 📊 Competitive Analysis

| Feature                  | StelginsHR | Oracle Taleo | iCIMS |
|--------------------------|------------|---------------|-------|
| Core AI Integration      | ✅         | ✅            | ✅    |
| Spam/Fake Filtering      | ✅         | ❌            | ❌    |
| Candidate Ranking        | ✅         | ✅            | ✅    |
| Recruiter Insights       | ✅         | ✅            | ✅    |
| Portfolio Verification   | ✅         | ❌            | ❌    |

Our **key differentiators** are advanced spam detection and portfolio analysis—critical features for creative and technical hiring.

---

## 👥 Meet the Team - ( ͡° ͜ʖ ͡°)

- **Izzhan Hakimi** – Project Manager  
- **Afzal Ariffin** – Frontend Developer  
- **Ahmad Iman** – Backend Developer  
- **Hafiz Adha** – AI Engineer

---

## 📬 Contact & License

Have any issue or inquiry? Contact

- Email: afzal.ariffin04@gmail.com 
- License: MIT

---

