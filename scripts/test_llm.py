import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("Error: GOOGLE_API_KEY not found in environment.")
    exit(1)

print(f"Testing Gemini with Python. Key present: {bool(api_key)}")

try:
    genai.configure(api_key=api_key)
    # models/gemini-1.5-flash is the standard path often
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    print("Sending request to Gemini...")
    response = model.generate_content("Hello, are you working?")
    
    print("\n--- Response ---")
    print(response.text)
    print("----------------")
    
except Exception as e:
    print("\n--- Error ---")
    print(e)
