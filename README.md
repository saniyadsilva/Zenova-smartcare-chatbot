**Zenova – Smart Healthcare Chatbot with Emotion Detection**
<br>
Zenova is an AI-powered healthcare chatbot designed to provide intelligent, context-aware responses by analyzing user emotions. It combines natural conversation with emotion detection to deliver more personalized and meaningful healthcare suggestions.<br>
<br>
Features - <br>
Interactive chatbot for healthcare queries<br>
Emotion detection from user input (text/image-based, depending on your implementation)<br>
Context-aware responses based on detected emotions<br>
Real-time interaction with responsive UI<br>
Backend API integration for processing and responses<br>
<br>
Tech Stack  <br>
Frontend - <br>
React.js <br>
HTML, CSS, Tailwind <br>
Backend - <br>
Python <br>
FastAPI <br>
Machine Learning <br>
Emotion detection model <br>
NLP-based response handling <br>
<br>
System Architecture
                    ┌─────────────────────┐
                    │        User         │
                    └──────────┬──────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
          Text Input      Speech Input     Facial Input
               │               │               │
               ▼               ▼               ▼
         Text Emotion     Speech Emotion   Facial Emotion
            Model            Model            Model
               │               │               │
               └───────────────┼───────────────┘
                               ▼
                       Emotion Fusion
                               │
                               ▼
                    Emotion-Aware Processing
                               │
                               ▼
                       Conversational AI
                               │
                               ▼
                    Personalized Response
                               │
                               ▼
                             User
                             <br>
## Project Screenshots
### Home Screen
![Home Screen](image.png)
### Chatbot Response
![Chatbot Response](result.png)
##Patent
A patent application has been published for the multimodal
emotion-aware healthcare conversational framework.

**Title:** A System and Method for a Multimodal Emotion-Aware Healthcare Conversational Framework

**Application No.:** 202641102032 A

**Publication Date:** 4 September 2026

[View Patent Publication](patent.pdf)
Backend Setup - <br>
pip install -r requirements.txt <br>
python main.py<br>
Frontend Setup -<br>
cd frontend<br>
npm install<br>
npm start<br>
<br>
How It Works - <br>
1. User interacts with the chatbot via UI<br>
2. Input is sent to backend API<br>
3. Emotion detection model analyzes user input<br>
4. Chatbot generates response based on emotion + query<br>
5. Response is displayed in real-time<br>
<br>
Author <br>
<br>
Saniya Dsilva<br>
