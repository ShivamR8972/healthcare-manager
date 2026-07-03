import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const generatePreVisitSummary = async (symptoms) => {
  const prompt = `Analyse these symptoms and return valid JSON data using exactly this structure:
  {
    "urgencyLevel": "Low" or "Medium" or "High",
    "chiefComplaint": "Short description",
    "suggestedQuestions": ["Q1", "Q2", "Q3"]
  }
  Symptoms: ${symptoms}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Failure, returning graceful fallback:", error);
    return {
      urgencyLevel: 'Error Processing',
      chiefComplaint: symptoms.substring(0, 60),
      suggestedQuestions: ['Could not generate questions automatically at this time.']
    };
  }
};

export const generatePostVisitSummary = async (notes) => {
  const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps. Return valid JSON only:
  {
    "summaryText": "text summary",
    "medicationSchedule": "medication timing details",
    "followUpSteps": "steps to take"
  }
  Notes: ${notes}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
    return JSON.parse(cleanJson);
  } catch (error) {
    return {
      summaryText: notes,
      medicationSchedule: 'Please check your physical prescription papers.',
      followUpSteps: 'Contact clinic if you have any questions.'
    };
  }
};