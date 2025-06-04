from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from io import BytesIO
from pdfminer.high_level import extract_text
import os
import google.generativeai as genai
from dotenv import load_dotenv
import re
import json
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.utils.math import cosine_similarity
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool # For running sync code in async endpoint
from supabase import create_client, Client
from fastapi import FastAPI, File, UploadFile, HTTPException
import shutil
import pandas as pd
from google import genai as gi
from markitdown import MarkItDown
import requests
from firecrawl import FirecrawlApp, JsonConfig
from typing import List, Optional





# Load embedding model
embedding_model = HuggingFaceEmbeddings(model_name="anass1209/resume-job-matcher-all-MiniLM-L6-v2")

load_dotenv("api_keys.env")
api_key = os.getenv("GEMINI_API_KEY")
# Configure the Gemini API
genai.configure(api_key=api_key)

# Use the Gemini Pro model (text-only)
model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")

app = FastAPI()


origins = [
    "http://localhost:3000",  # Your React Native web app development server
    "http://localhost:3001",
    "http://localhost",  # Sometimes useful if accessing from localhost without port
    # Add any other origins you need (e.g., your deployed frontend URL)
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Or restrict to your frontend's origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_similarity(text1:str, text2:str):
    # Get embeddings
    emb1 = embedding_model.embed_query(text1)
    emb2 = embedding_model.embed_query(text2)

    # Convert to NumPy arrays
    vec1 = np.array(emb1).reshape(1, -1)
    vec2 = np.array(emb2).reshape(1, -1)

    # Cosine similarity
    cos_sim = cosine_similarity(vec1, vec2)[0][0]

    # Euclidean distance
    #euclidean_dist = np.linalg.norm(vec1 - vec2)
    return cos_sim

load_dotenv("api_keys.env")
SUPABASE_URL = "https://lpfoskbcrtqzooatpann.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
BUCKET_NAME = "pdf-files"

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_API_KEY not found in api_keys.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    input: str = Field(..., description="The HR user's question about the candidate.")
    resume_id: str = Field(..., description="The ResumeID of the candidate (e.g., '0', '1', '23').")
                                       # Assuming ResumeID is stored as string or can be cast to string.
                                       # If it's always an int, you can use int here.

class ChatResponse(BaseModel):
    generated_response: str

class JobFrontendFormat(BaseModel):
    id: str
    title: str # This will be job_role from your DB
    company: Optional[str] = "N/A" # Default if not found
    location: Optional[str] = "N/A"
    type: Optional[str] = "N/A" # e.g., Full-time, Internship
    experience: Optional[str] = "N/A"
    salary: Optional[str] = "N/A"
    description: str # A concise description extracted by the LLM
    requirements: List[str] = []
    benefits: List[str] = []

# You might also want a model for the raw data from Supabase for type hinting
class JobRoleDB(BaseModel):
    id: int
    job_role: str
    job_description: str
    required_skills: Optional[str] # As per your CSV


def portfolio_scraper(portfolio_str):
    portfolio_str = "https://coedd-territory.vercel.app/"

    FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
    app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)

    response = app.extract([
    portfolio_str
    ], prompt='Extract the applicants name and email, their projects, experiences and top skills. For projects and experiences, include their name and description. Then for skills in project and experience, include into top skills')
    print(response)

    print(json.dumps(response.data, indent=4))

    # JANGAN LUPA FORMATTING

def ai_detection():
    gemini_client =  gi.Client(api_key="EnterAPI")

    results = supabase.table("job_applications").select("*").eq("is_analyzed", False).execute()

    rows = results.data

    for row in rows:

        pdf_name = str(row["ResumeID"])+ ".pdf"
        print(pdf_name)

        signed_url_data = supabase.storage.from_("pdf-files").download(pdf_name)

        with open(pdf_name, "wb") as f:
            f.write(signed_url_data)
        

        md = MarkItDown(llm_client=gemini_client, llm_model="gemini-2.5-flash-preview-05-20")
        result = md.convert(pdf_name)

        response = requests.post(
        "https://api.sapling.ai/api/v1/aidetect",
        json={
            "key": "ENTER API KEY",
            "text": result.text_content
        })

        decoded = response.content.decode('utf-8')
        json_data = json.loads(decoded)
    # Extract only the top-level "score"
        main_score = json_data["score"]

        update_data = {
        "is_analyzed": True,
        "ai_generated_score": main_score * 100  # Replace with your calculated score
        }

    # Perform the update
        response = supabase.table("job_applications").update(update_data).eq("id", row['id']).execute()

        if os.path.exists(pdf_name):
            os.remove(pdf_name)

async def upload_pdf_from_bytes(file_content: bytes, save_as: str = "temp_file.pdf"):
    try:
        with open(save_as, "wb") as buffer:
            buffer.write(file_content)
        return {"message": f"File saved as {save_as}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# --- Helper Functions ---
def find_similarity(text1:str, text2:str) -> float: # Added type hint for return
    emb1 = embedding_model.embed_query(text1)
    emb2 = embedding_model.embed_query(text2)
    vec1 = np.array(emb1).reshape(1, -1)
    vec2 = np.array(emb2).reshape(1, -1)
    cos_sim = cosine_similarity(vec1, vec2)[0][0]
    return float(cos_sim) # Ensure it's a float

async def get_resume_full_text(resume_id_str: str) -> str:
    """
    Downloads a resume PDF from Supabase (named as resume_id_str.pdf) and extracts its full text.
    """
    pdf_filename_on_storage = f"{resume_id_str}.pdf"
    try:
        # print(f"Attempting to download: {pdf_filename_on_storage} from bucket: {BUCKET_NAME}")
        pdf_bytes = await run_in_threadpool(supabase.storage.from_(BUCKET_NAME).download, pdf_filename_on_storage)

        if not pdf_bytes: # Check if download returned None or empty bytes
            raise FileNotFoundError(f"PDF {pdf_filename_on_storage} not found or empty in Supabase storage.")

        pdf_stream = BytesIO(pdf_bytes)
        full_text = await run_in_threadpool(extract_text, pdf_stream)
        return full_text.replace("\n", " ").strip() # Normalize newlines and strip whitespace
    except Exception as e: # Catching a broader exception from supabase download
        print(f"Error getting full text for resume {resume_id_str}: {type(e).__name__} - {e}")
        # Supabase download might raise different errors, not just FileNotFoundError
        # Check message for common indicators of "not found"
        if "The resource was not found" in str(e) or "NotFound" in str(e) or "does not exist" in str(e).lower():
             raise HTTPException(status_code=404, detail=f"Resume PDF for ID '{resume_id_str}' not found in storage.")
        raise HTTPException(status_code=500, detail=f"Could not extract text from resume PDF: {str(e)}")


# --- API Endpoints ---

# --- Helper for LLM Parsing of Job Description ---
async def parse_job_description_to_structured_format(job_title: str, job_description_text: str) -> JobFrontendFormat:
    """
    Uses Gemini to parse a raw job description text into a structured format.
    """
    prompt = f"""
You are an expert job description parser. Your task is to extract specific information from the provided job description text and format it as a JSON object.

Job Title: {job_title}
Raw Job Description Text:
---
{job_description_text}
---

Based *only* on the "Raw Job Description Text" provided above, extract the following information.
If a piece of information is not explicitly mentioned, use "Not specified" for string fields or an empty list [] for list fields.

Return ONLY a valid JSON object in the following exact format:
{{
  "company": "string (e.g., TechCorp Inc.)",
  "location": "string (e.g., San Francisco, CA (Remote))",
  "type": "string (e.g., Full-time, Internship, Contract)",
  "experience": "string (e.g., 5+ years experience, Entry Level)",
  "salary": "string (e.g., $120k - $150k, Competitive)",
  "description": "string (A concise summary of the job role, 1-2 sentences max. If the original description is short, you can use it. Focus on the core responsibilities.)",
  "requirements": ["string", "string", ...],
  "benefits": ["string", "string", ...]
}}

Important Considerations:
- For "requirements" and "benefits", list each distinct point as a separate string in the array.
- If the description mentions "Responsibilities", "Requirements", "Qualifications", "Skills", etc., these should primarily go into the "requirements" list.
- If the description mentions "Perks", "What we offer", "Benefits", etc., these should go into the "benefits" list.
- Be accurate and stick to the provided text. Do not infer or add external information.
- The "description" field should be a brief overview, not the entire job description.

JSON Output:
    """

    try:
        # print(f"--- Sending to Gemini for JD Parsing ({job_title}) ---")
        # print(prompt)
        # print("-----------------------------------------------------")
        response = await run_in_threadpool(model.generate_content, prompt)

        if response.candidates and response.candidates[0].content.parts:
            raw_json_text = response.candidates[0].content.parts[0].text.strip()
            # print(f"--- Raw JSON from Gemini ({job_title}) ---")
            # print(raw_json_text)
            # print("-------------------------------------------")

            # Clean up potential markdown code block
            cleaned_json_text = re.sub(r"^```json\s*", "", raw_json_text, flags=re.MULTILINE)
            cleaned_json_text = re.sub(r"\s*```$", "", cleaned_json_text, flags=re.MULTILINE).strip()

            parsed_data = json.loads(cleaned_json_text)

            # Validate and construct the JobFrontendFormat object
            # Provide defaults directly in the model, but can also do here
            return JobFrontendFormat(
                id="temp", # Will be replaced by DB ID
                title=job_title,
                company=parsed_data.get("company", "Not specified"),
                location=parsed_data.get("location", "Not specified"),
                type=parsed_data.get("type", "Not specified"),
                experience=parsed_data.get("experience", "Not specified"),
                salary=parsed_data.get("salary", "Not specified"),
                description=parsed_data.get("description", "No specific summary provided."),
                requirements=parsed_data.get("requirements", []),
                benefits=parsed_data.get("benefits", [])
            )
        else:
            error_reason = "No response from LLM"
            if response.prompt_feedback:
                error_reason = f"LLM prompt feedback: {response.prompt_feedback}"
            print(f"Could not parse job description for '{job_title}': {error_reason}")
            # Return a default structure indicating failure for this specific job
            return JobFrontendFormat(id="temp", title=job_title, description=f"Could not parse job details: {error_reason}")

    except json.JSONDecodeError as e:
        print(f"JSONDecodeError for '{job_title}': {e}. Raw text: '{cleaned_json_text if 'cleaned_json_text' in locals() else raw_json_text if 'raw_json_text' in locals() else 'N/A'}'")
        return JobFrontendFormat(id="temp", title=job_title, description=f"Error parsing LLM response (JSON format issue).")
    except Exception as e:
        print(f"Exception parsing job description for '{job_title}': {type(e).__name__} - {e}")
        return JobFrontendFormat(id="temp", title=job_title, description=f"An unexpected error occurred during parsing: {str(e)}")


@app.get("/api/structured-job-roles", response_model=List[JobFrontendFormat])
async def get_structured_job_roles():
    """
    Fetches all job roles from the database, parses their descriptions using an LLM,
    and returns them in a structured format suitable for the frontend.
    """
    formatted_jobs: List[JobFrontendFormat] = []
    try:
        db_response = await run_in_threadpool(
            supabase.table("job_role").select("id, job_role, job_description").execute
        )

        if not db_response.data:
            return [] # No jobs found

        for job_from_db in db_response.data:
            db_id_str = str(job_from_db.get("id"))
            job_title = job_from_db.get("job_role", "Untitled Job")
            raw_description = job_from_db.get("job_description", "")

            if not raw_description:
                # Handle cases with no description
                formatted_job = JobFrontendFormat(
                    id=db_id_str,
                    title=job_title,
                    description="No job description provided."
                )
                formatted_jobs.append(formatted_job)
                continue

            # Parse the raw description
            parsed_job_details = await parse_job_description_to_structured_format(job_title, raw_description)

            # Update the id and title from the database record, as parsing focuses on other fields
            parsed_job_details.id = db_id_str
            parsed_job_details.title = job_title # Ensure DB title is used

            formatted_jobs.append(parsed_job_details)

        return formatted_jobs

    except Exception as e:
        print(f"Error in /api/structured-job-roles: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch or process job roles.")

@app.post("/api/chat", response_model=ChatResponse)
async def resume_chat(request: ChatRequest):
    """
    Handles chat interaction with an AI assistant about a specific resume.
    """
    try:
        try:
            # ResumeID is an integer in the database, but comes as string from request
            resume_id_int = int(request.resume_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid ResumeID format. Must be a number: '{request.resume_id}'")

        # 1. Fetch application data from Supabase based on ResumeID (integer)
        db_response = await run_in_threadpool(
            supabase.table("job_applications")
            .select("*")
            .eq("id", resume_id_int)
            .maybe_single() # Expects 0 or 1 row
            .execute
        )

        if not db_response.data:
            raise HTTPException(status_code=404, detail=f"Candidate data for ResumeID '{request.resume_id}' not found.")

        candidate_data = db_response.data # This is a dictionary for the single row

        # 2. Get full resume text (using the original string resume_id for filename)
        # full_resume_text = await get_resume_full_text(request.resume_id)
        # if not full_resume_text: # Add a check here just in case
        #     full_resume_text = "Resume text could not be extracted."
        


        # 3. Prepare data for the prompt
        # Composite Match Score (Average of available similarities)
        similarity_scores = [
            candidate_data.get("Experience_Similarity"),
            candidate_data.get("Education_Similarity"),
            candidate_data.get("Skill_Similarity"),
            candidate_data.get("Level_Similarity")
        ]
        valid_scores = [s for s in similarity_scores if isinstance(s, (int, float))] # Filter out None or non-numeric
        overall_match_score_val = (sum(valid_scores) / len(valid_scores) * 100) if valid_scores else 0.0
        overall_match_score_str = f"{overall_match_score_val:.2f}"

        # AI Generated Content Percentage
        ai_score_val = candidate_data.get("ai_generated_score")
        if isinstance(ai_score_val, (int, float)):
            ai_generated_percentage_str = f"{ai_score_val:.2f}" # Using the direct value
        elif candidate_data.get("is_analyzed") == False:
            ai_generated_percentage_str = "Not yet analyzed"
        else:
            ai_generated_percentage_str = "N/A"


        # Spam Score (not in CSV, so explicitly state as N/A)
        spam_score_str = "N/A (not available in current analysis)"

        # Extracted Skills
        extracted_skills_str = candidate_data.get("Skills", "Not specified in the analysis")
        if not extracted_skills_str: extracted_skills_str = "Not specified in the analysis"


        # 4. Construct the prompt for Gemini
        #    Ensure all placeholders are filled with string values
        prompt_template = f"""
You are an expert HR Resume Analysis Assistant.
Your primary function is to answer questions about a specific candidate's resume and its analysis, based *solely* on the information provided to you below.
Do not make assumptions, invent information, or use any external knowledge beyond what is given here.
If the answer cannot be found in the provided information, clearly state that the information is not available in the resume or analysis provided.
Be concise and professional in your responses.

Candidate Information (ID: {request.resume_id}):
---
Full Resume Text:
{candidate_data}
---
Analysis Scores:
- Composite Match Score (average of similarities): {overall_match_score_str}%
- AI Generated Content Percentage: {ai_generated_percentage_str}%
- Spam Score: {spam_score_str}
---
Extracted Skills:
{extracted_skills_str}
---

HR User's Question:
"{request.input}"

Based on the information provided above, please answer the HR User's question.

Your Answer:
"""
        # print("---- PROMPT FOR GEMINI ----")
        # print(prompt_template)
        # print("--------------------------")

        # 5. Send prompt to Gemini API
        gemini_response = await run_in_threadpool(model.generate_content, prompt_template)

        generated_text = "I am unable to provide a response based on the information." # Default
        if gemini_response.candidates and gemini_response.candidates[0].content.parts:
            generated_text = gemini_response.candidates[0].content.parts[0].text.strip()
        elif gemini_response.prompt_feedback:
            generated_text += f" (Reason: {gemini_response.prompt_feedback})"
        
        if not generated_text.strip(): # If Gemini returns an empty string
             generated_text = "The model generated an empty response. Please try rephrasing your question or check the provided candidate data."


        return ChatResponse(generated_response=generated_text)

    except HTTPException as e:
        raise e # Re-raise HTTPExceptions to let FastAPI handle them
    except Exception as e:
        print(f"Error in /api/chat: {type(e).__name__} - {e}")
        # Consider logging `e` with `traceback.format_exc()` for full stack trace
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while processing your chat request: {str(e)}")

@app.get("/get_available_jobs")
async def get_available_jobs():
    table_name = "job_role"
    table_ref = supabase.table(table_name)
    response = table_ref.select("*").execute()
    return response.data

@app.get("/get_all_job_applications")
async def get_all_job_applications():
    table_name = "job_applications" # Name of your table
    try:
        response = supabase.table(table_name).select("*").execute()
        if response.data:
            return response.data
        else:
            return []
    except Exception as e:
        print(f"Error fetching from {table_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching job applications: {str(e)}")
    
@app.get("/get_job_application/{resume_id}")
async def get_job_application_by_resume_id(resume_id: int):
    table_name = "job_applications"
    try:
        # .eq() stands for "equals"
        response = supabase.table(table_name).select("*").eq("id", resume_id).execute()
        if response.data:
            return response.data[0] # Assuming ResumeID is unique, returns the first match
        else:
            raise HTTPException(status_code=404, detail=f"Application with ResumeID {resume_id} not found")
    except HTTPException:
        raise # Re-raise HTTPException
    except Exception as e:
        print(f"Error fetching application {resume_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/send_job_application")
async def send_job_application(selected_job_id: int, file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(content={"error": "Only PDF files are allowed."}, status_code=400)


    response = supabase.table("job_role").select("*").eq("id", selected_job_id).execute()

    rows = response.data
    print(rows)

    job_desc = rows[0]["job_description"]
    job_role = rows[0]["job_role"]

    parsed_job_desc = model.generate_content(
    f"""
    You are a Job Description parser that will extract information about job description,
    Job Title : {job_role}
    Job Description ; {job_desc}
    
    Your job is to extract the Education required, What the candidate is expected to do on the job and the education required.
    Return ONLY a valid JSON object in this exact format, with no additional text or formatting:
    {{
        "Education": "string",
        "Experience": "string",
        "Skills": "string",
        "Level": "string"
    }}
    """
    )
    
    try:
        answer_job_desc = parsed_job_desc.text.strip()
        # Remove any markdown code block indicators
        answer_job_desc = re.sub(r"^```json\s*", "", answer_job_desc, flags=re.MULTILINE)
        answer_job_desc = re.sub(r"\s*```$", "", answer_job_desc, flags=re.MULTILINE)
        answer_job_desc = answer_job_desc.strip()
        
        if not answer_job_desc:
            raise ValueError("Empty response from model")
            
        job_desc_json = json.loads(answer_job_desc)
        
        # Validate required fields
        required_fields = ["Education", "Experience", "Skills", "Level"]
        if not all(field in job_desc_json for field in required_fields):
            raise ValueError("Missing required fields in model response")
            
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing model response: {e}")
        print(f"Raw response: {parsed_job_desc.text}")
        return JSONResponse(
            content={"error": "Failed to parse job description"},
            status_code=500
        )

    print("-------------------")
    print(job_desc_json)
    print("--------------------")


    

    try:
        # Read the uploaded PDF into a BytesIO buffer
        '''
        table_ref = db.reference('job_applications')
        raw = table_ref.get()
        if isinstance(raw, dict):
            records = list(raw.values())
        elif isinstance(raw, list):
            records = raw
        else:
            records = []
        # 3) Turn into DataFrame
        
        df = pd.DataFrame(records)
        try:
            max_number = int(df["ResumeID"].max())
        except:
            max_number = -1
        new_resume_id = max_number + 1
        '''

        
        table_ref = supabase.table("job_applications")
        response = table_ref.select("*").execute()
        df_temp = pd.DataFrame(response.data)

        try:
            max_number = int(df_temp["ResumeID"].max())
        except:
            max_number = -1
        new_resume_id = max_number + 1



        file_content = await file.read()
        pdf_stream = BytesIO(file_content)

        # Extract text using pdfminer.six
        text = extract_text(pdf_stream)

        text = text.replace("\n"," ")

        print(text)

        print("-------------------")
        print(job_desc_json)
        print("--------------------")
        # Example prompt
        response = model.generate_content(f"""

        resume text: {text.strip()}

        Based on this resume text, extract the
        {{
        Skills : "string" (Here you should list out the tools and skills this candidate has based on his whole resume)
        Experience : "string" (Here you should put what the candidate has experience in doing and what he/she is able to do)
        Education : "string" (Here you should specify the candidate's what degree he/she has dont specify the institution)
        Name : "string"
        Phone_Number : "string"
        Email : "string"
        Linkedin_link : "string" (Here if the resume doesnt have a linkedin link just put "Not Specified")
        Portfolio_link : "string (Here if the resume doesnt have a portfolio link just put "Not Specified")
        Extra: "string" (Here you should put Extracurriculars,Leadership,Awards)
        Level : "string" (Based on this candidate's resume, do you think the candidate is applying for internship, entry level, mid level, junior level or senior level position)
        }}


        your output should be in json format

        ensure that the values are just one string value 

        YOU  SHOULD RETURN A JSON FILE AND NOTHING ELSE

        """)

        answer = response.text
        answer = re.sub(r"^```json\s*", "", answer, flags=re.MULTILINE)
        answer = re.sub(r"\s*```$", "", answer, flags=re.MULTILINE)
        answer = answer.strip()
        print(1)
        
        answer_json = json.loads(answer)
        print(2)
        experience_similarity = float(find_similarity(answer_json["Experience"],job_desc_json["Experience"]))
        education_similarity = float(find_similarity(answer_json["Education"],job_desc_json["Education"]))
        skill_similarity = float(find_similarity(answer_json["Skills"], job_desc_json["Skills"]))
        level_similarity = float(find_similarity(answer_json["Level"],job_desc_json["Level"]))

        answer_json["Experience_Similarity"] = float(experience_similarity)
        answer_json["Education_Similarity"] = float(education_similarity)
        answer_json["Skill_Similarity"] = float(skill_similarity)
        answer_json["Level_Similarity"] = float(level_similarity)
        answer_json["Job_Desc"] = job_desc
        answer_json["ResumeID"] = new_resume_id
        answer_json["job_role_id"] = selected_job_id
        print(3)

        print("-------------------")
        print(answer_json)
        print("-------------------")

        try:
            await upload_pdf_from_bytes(file_content, save_as="temp_file.pdf")

            with open("temp_file.pdf", "rb") as f:
                try:
                    response = supabase.storage.from_(BUCKET_NAME).upload(
                        file=f,
                        path=f"{new_resume_id}.pdf",
                        file_options={"cache-control": "3600", "upsert": "true"}
                    )
                except Exception as upload_error:
                    print(f"Error uploading PDF: {str(upload_error)}")
                    # Try to delete the temporary file
                    try:
                        os.remove("temp_file.pdf")
                    except:
                        pass
                    raise HTTPException(status_code=500, detail=f"Failed to upload PDF: {str(upload_error)}")

            # Try to delete the temporary file after successful upload
            try:
                os.remove("temp_file.pdf")
            except:
                pass

            # Insert into job_applications table
            try:
                response = supabase.table("job_applications").insert(answer_json).execute()
                if hasattr(response, '_error') and response._error:
                    raise Exception(f"Database error: {response._error}")
                return answer_json
            except Exception as db_error:
                print(f"Error inserting into database: {str(db_error)}")
                # Try to delete the uploaded PDF if database insert fails
                try:
                    supabase.storage.from_(BUCKET_NAME).remove([f"{new_resume_id}.pdf"])
                except:
                    pass
                raise HTTPException(status_code=500, detail=f"Failed to save application: {str(db_error)}")

        except Exception as e:
            print(f"Error in application process: {str(e)}")
            # Clean up any temporary files
            try:
                os.remove("temp_file.pdf")
            except:
                pass
            raise HTTPException(status_code=500, detail=str(e))
    
    except Exception as e:
        print(f"Error in main process: {str(e)}")
        if 'response' in locals() and hasattr(response, '_error'):
            print(f"Database error: {response._error}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/get_resume_pdf")
def download_pdf(pdf_filename: str = Query(..., description="The name of the PDF in Supabase")):
    try:
        # Download the file from Supabase
        response = supabase.storage.from_(BUCKET_NAME).download(pdf_filename)

        # Save it using the original filename
        with open(pdf_filename, "wb") as f:
            f.write(response)

        # return {"message": f"{pdf_filename} downloaded and saved locally."}
        # Return the file to the client
        return FileResponse(path=pdf_filename, filename=pdf_filename, media_type='application/pdf')
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

    

    
