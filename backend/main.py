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
import firebase_admin
from firebase_admin import db, credentials
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from fastapi import FastAPI, File, UploadFile, HTTPException
import shutil
import pandas as pd
from google import genai
from markitdown import MarkItDown
import requests




# Load embedding model
embedding_model = HuggingFaceEmbeddings(model_name="anass1209/resume-job-matcher-all-MiniLM-L6-v2")

load_dotenv("api_keys.env")
api_key = os.getenv("GEMINI_API_KEY")
# Configure the Gemini API
genai.configure(api_key=api_key)

# Use the Gemini Pro model (text-only)
model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")

app = FastAPI()

cred = credentials.Certificate("credentials.json")
firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": "https://hack-attack-cd723-default-rtdb.asia-southeast1.firebasedatabase.app/"
    },
)

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


def ai_detection():

    gemini_client = genai.Client(api_key="EnterAPI")

    results = (
    supabase.table("job_applications").select("*").eq("is_analyzed", False).execute()
)

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

        

        




@app.get("/get_available_jobs")
async def get_available_jobs():
    table_name = "job_role"
    table_ref = supabase.table(table_name)
    response = table_ref.select("*").execute()
    return response.data


@app.post("/send_job_application")
async def send_job_application(selected_job: str = Form(...), file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(content={"error": "Only PDF files are allowed."}, status_code=400)
    

    selected_job = selected_job.strip()
    print(selected_job)


    response = supabase.table("job_role").select("*").eq("job_role", selected_job).execute()

    rows = response.data

    job_desc = rows[0]["job_description"]

    parsed_job_desc = model.generate_content(
    f"""
    You are a Job Description parser that will extract information about job description,
    Job Title : {selected_job}
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


async def upload_pdf_from_bytes(file_content: bytes, save_as: str = "temp_file.pdf"):
    try:
        with open(save_as, "wb") as buffer:
            buffer.write(file_content)
        return {"message": f"File saved as {save_as}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/get_resume_pdf")
def download_pdf(pdf_filename: str = Query(..., description="The name of the PDF in Supabase")):
    try:
        # Download the file from Supabase
        response = supabase.storage.from_(BUCKET_NAME).download(pdf_filename)

        # Save it using the original filename
        with open(pdf_filename, "wb") as f:
            f.write(response)

        return {"message": f"{pdf_filename} downloaded and saved locally."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    

    
