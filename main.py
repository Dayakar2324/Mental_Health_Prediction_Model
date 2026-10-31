import joblib 
from fastapi import FastAPI
from pydantic import BaseModel,Field
from typing import Literal 
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load("Mental_Health_Prediction_Model.pkl")
print("Model expects:", model.feature_names_in_.tolist())
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"]
)


@app.get("/")
def greet():
    return "Hello this is for checking connection "
    
class StudentData(BaseModel):
    Age:int = Field(...,ge = 10 ,le = 100)

    Gender:Literal['Male','Female']
    Country:str
    Academic_Level:Literal['Undergraduate', 'Graduate', 'High School']
    Most_Used_Platform:Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    Purpose_Of_Use: Literal['Networking', 'Education', 'Entertainment', 'News']
    Avg_Daily_Usage_Hours:float = Field(...,ge = 1,le =24)
    Daily_Unlocks:int=Field(...,ge=0,le = 500)
    Study_Hours:float=Field(...,ge=0,le = 24)
    Physical_Activity_Hours:float=Field(...,ge=0,le = 24)
    Sleep_Hours_Per_Night:float = Field(...,ge=0,le = 24)
    Stress_Level:Literal['Medium', 'Low', 'Very High', 'High']
    
class PredictionResponse(BaseModel):
    Predicted_Mental_Health_Score: float


top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']


@app.post("/predict",response_model=PredictionResponse)
def predict(data: StudentData):
    country_group = data.Country if data.Country in top_countries else "Other"
    input_df = pd.DataFrame([
        {
            'Age': data.Age,
            'Gender': data.Gender,
            'Country': data.Country,
            'Academic_Level': data.Academic_Level,
            'Most_Used_Platform': data.Most_Used_Platform,
            'Purpose_Of_Use': data.Purpose_Of_Use,
            'Avg_Daily_Usage_Hours': data.Avg_Daily_Usage_Hours,
            'Daily_Unlocks': data.Daily_Unlocks,
            'Study_Hours': data.Study_Hours,
            'Physical_Activity_Hours': data.Physical_Activity_Hours,
            'Sleep_Hours_Per_Night': data.Sleep_Hours_Per_Night,
            'Stress_Level': data.Stress_Level,
            'Grouped_Country': country_group
        }
    ])
    prediction = model.predict(input_df)[0]
    return PredictionResponse(Predicted_Mental_Health_Score= round(float(prediction),2))



    

















#python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload  

