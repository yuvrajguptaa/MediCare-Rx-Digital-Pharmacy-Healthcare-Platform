import os
import requests
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from backend_core.db import get_db, serialize_doc

DISCLAIMER = (
    "⚠️ **Medical Disclaimer**: MediAI provides general healthcare and medicine information for educational purposes only. "
    "It is NOT a substitute for professional medical advice, clinical diagnosis, or prescription. "
    "Always consult a licensed physician or healthcare provider before starting or changing any medication."
)

# Robust fallback knowledge engine for healthcare & medicine queries
KNOWLEDGE_BASE = {
    'paracetamol': {
        'title': 'Paracetamol (Acetaminophen)',
        'uses': 'Analgesic and antipyretic used to relieve mild-to-moderate pain (headaches, muscle aches, toothaches) and reduce fever.',
        'dosage_guidance': 'Standard adult oral dosage is typically 500mg - 650mg every 4 to 6 hours as needed. Maximum recommended daily dose is 4,000mg (4g) to prevent hepatic (liver) toxicity.',
        'common_side_effects': 'Generally well tolerated at therapeutic doses. High doses can cause acute liver injury.',
        'precautions': 'Avoid alcohol consumption while taking paracetamol. Check other cold & flu medications to avoid accidental overdose.'
    },
    'amoxicillin': {
        'title': 'Amoxicillin',
        'uses': 'Broad-spectrum penicillin-type antibiotic used to treat bacterial infections including ear infections, strep throat, pneumonia, and urinary tract infections.',
        'dosage_guidance': 'Common adult dosage is 250mg to 500mg every 8 hours, or 500mg to 875mg every 12 hours depending on infection severity.',
        'common_side_effects': 'Nausea, diarrhea, stomach upset, mild rash.',
        'precautions': 'Complete the full course prescribed by your physician even if symptoms improve early. Never use for viral infections like colds or influenza.'
    },
    'ibuprofen': {
        'title': 'Ibuprofen',
        'uses': 'Non-steroidal anti-inflammatory drug (NSAID) used for pain relief, reducing inflammation/swelling, and managing fevers.',
        'dosage_guidance': 'Adults: 200mg to 400mg every 4 to 6 hours with food or milk to prevent gastric irritation. Max OTC dose: 1,200mg/day.',
        'common_side_effects': 'Heartburn, stomach discomfort, dizziness.',
        'precautions': 'Should be taken with food. Use with caution in patients with history of peptic ulcers, kidney disease, or cardiovascular conditions.'
    },
    'metformin': {
        'title': 'Metformin',
        'uses': 'First-line oral medication for the management of type 2 diabetes mellitus. Helps lower blood glucose levels by decreasing hepatic glucose production and improving insulin sensitivity.',
        'dosage_guidance': 'Usually started at 500mg once or twice daily with meals, titrated as advised by endocrinologist.',
        'common_side_effects': 'Gastrointestinal disturbances (nausea, flatulence, diarrhea), metallic taste.',
        'precautions': 'Must be taken with meals to minimize stomach upset. Regular renal function monitoring is recommended.'
    },
    'atorvastatin': {
        'title': 'Atorvastatin',
        'uses': 'HMG-CoA reductase inhibitor (statin) used to lower LDL ("bad") cholesterol and triglycerides, reducing the risk of heart attack and stroke.',
        'dosage_guidance': 'Usual dose ranges from 10mg to 80mg taken once daily, preferably at the same time every evening.',
        'common_side_effects': 'Muscle aches, mild digestive issues.',
        'precautions': 'Avoid excessive grapefruit juice consumption. Report unexplained muscle soreness or weakness to your doctor immediately.'
    },
    'pantoprazole': {
        'title': 'Pantoprazole',
        'uses': 'Proton pump inhibitor (PPI) that decreases stomach acid production. Used for GERD, acid reflux, heartburn, and peptic ulcers.',
        'dosage_guidance': 'Usually 40mg once daily taken 30-60 minutes before breakfast.',
        'common_side_effects': 'Headache, diarrhea, abdominal pain.',
        'precautions': 'Swallow tablet whole without crushing or chewing.'
    },
    'cetirizine': {
        'title': 'Cetirizine',
        'uses': 'Second-generation antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, itching, and hives.',
        'dosage_guidance': 'Adults and children over 6 years: 5mg to 10mg once daily.',
        'common_side_effects': 'Mild drowsiness, dry mouth, fatigue.',
        'precautions': 'Be cautious when driving or operating machinery until you know how it affects you.'
    }
}

class MediAIChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        prompt = request.data.get('prompt', '').strip()
        history = request.data.get('history', [])

        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for matching medicine in local catalog first
        db = get_db()
        matched_med = None
        words = [w.lower() for w in prompt.replace('?', '').replace(',', '').split() if len(w) > 3]
        for word in words:
            med_doc = db.medicines.find_one({
                'is_active': True,
                '$or': [
                    {'name': {'$regex': word, '$options': 'i'}},
                    {'generic_name': {'$regex': word, '$options': 'i'}}
                ]
            })
            if med_doc:
                matched_med = med_doc
                break

        # Check Gemini API Key
        gemini_api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')

        if gemini_api_key:
            try:
                system_instruction = (
                    "You are MediAI, an expert, caring, and professional pharmaceutical and healthcare informational assistant "
                    "for MediCare Online Pharmacy. Provide helpful, accurate, and easy-to-understand explanations of medicines, "
                    "ingredients, dosage guidelines, common uses, side effects, and health terminology. "
                    "CRITICAL RULES: Always emphasize that you are an AI assistant and NOT a doctor. "
                    "Do NOT provide clinical diagnoses or personalized prescriptions. "
                    "Always advise consulting a qualified doctor or pharmacist for treatment decisions."
                )
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
                headers = {'Content-Type': 'application/json'}
                
                # Format conversation history
                contents = []
                for msg in history[-6:]:
                    role = 'user' if msg.get('role') == 'user' else 'model'
                    contents.append({'role': role, 'parts': [{'text': msg.get('content', '')}]})
                
                contents.append({'role': 'user', 'parts': [{'text': prompt}]})
                
                payload = {
                    'system_instruction': {'parts': [{'text': system_instruction}]},
                    'contents': contents,
                    'generationConfig': {
                        'temperature': 0.4,
                        'maxOutputTokens': 800
                    }
                }
                
                res = requests.post(url, headers=headers, json=payload, timeout=8)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get('candidates', [])
                    if candidates and candidates[0].get('content', {}).get('parts'):
                        reply = candidates[0]['content']['parts'][0]['text']
                        return Response({
                            'response': reply,
                            'disclaimer': DISCLAIMER,
                            'matched_medicine': serialize_doc(matched_med) if matched_med else None
                        }, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Gemini API invocation fallback: {e}")

        # Intelligent Built-in Healthcare Knowledge Fallback
        lower_prompt = prompt.lower()
        response_text = ""

        # Check in knowledge base keys
        found_kb = None
        for key, info in KNOWLEDGE_BASE.items():
            if key in lower_prompt:
                found_kb = info
                break

        if found_kb:
            response_text = (
                f"### {found_kb['title']}\n\n"
                f"**🩺 Primary Uses & Indications:**\n{found_kb['uses']}\n\n"
                f"**💊 Dosage Guidelines:**\n{found_kb['dosage_guidance']}\n\n"
                f"**⚠️ Common Side Effects:**\n{found_kb['common_side_effects']}\n\n"
                f"**🔍 Key Precautions:**\n{found_kb['precautions']}"
            )
        elif matched_med:
            rx_text = "Requires a valid doctor prescription." if matched_med.get('prescription_required') else "Available over-the-counter (OTC)."
            response_text = (
                f"### Information for {matched_med.get('name')} ({matched_med.get('brand')})\n\n"
                f"- **Generic Active Ingredient:** {matched_med.get('generic_name', 'N/A')}\n"
                f"- **Dosage Form & Strength:** {matched_med.get('dosage_form', 'Tablet')} - {matched_med.get('strength', '')}\n"
                f"- **Category:** {matched_med.get('category')}\n"
                f"- **Prescription Status:** {rx_text}\n"
                f"- **Key Uses:** {matched_med.get('uses', matched_med.get('description', ''))}\n"
                f"- **Active Ingredients:** {matched_med.get('ingredients', 'See product packaging')}\n"
                f"- **Price in Catalog:** ₹{matched_med.get('selling_price')} (MRP: ₹{matched_med.get('mrp')})\n\n"
                f"You can view complete product details and availability in our catalog."
            )
        elif 'prescription' in lower_prompt or 'upload' in lower_prompt:
            response_text = (
                "### How Prescription Verification Works at MediCare:\n\n"
                "1. **Upload**: You can upload a clear photo (JPG, PNG) or PDF of your valid doctor's prescription via the Prescription tab or during checkout.\n"
                "2. **Pharmacist Review**: Our licensed registered pharmacists verify the dosage, doctor's registration number, and validity within minutes.\n"
                "3. **Order Processing**: Once approved, your order is packed and dispatched directly to your address."
            )
        elif 'fever' in lower_prompt or 'headache' in lower_prompt or 'pain' in lower_prompt:
            response_text = (
                "### General Information for Fever & Mild Pain Management:\n\n"
                "- **Common OTC Options:** Paracetamol (Acetaminophen) and Ibuprofen are widely used for reducing fever and easing headaches or body aches.\n"
                "- **Hydration & Rest:** Drink plenty of fluids (water, electrolytes) and get adequate rest.\n"
                "- **When to see a doctor:** If fever exceeds 103°F (39.4°C), lasts longer than 3 consecutive days, or is accompanied by severe stiff neck, breathing difficulty, or confusion, seek immediate medical attention."
            )
        elif 'diabetes' in lower_prompt or 'blood sugar' in lower_prompt:
            response_text = (
                "### General Information on Diabetes & Blood Sugar Management:\n\n"
                "- **Medications:** Common oral medications include Metformin, Glimepiride, and DPP-4 inhibitors, alongside insulin therapies prescribed by endocrinologists.\n"
                "- **Routine Monitoring:** Regular fasting and post-prandial blood glucose checks along with HbA1c tests (every 3 months) are vital.\n"
                "- **Lifestyle:** Balanced low-glycemic nutrition, regular aerobic exercise, and adherence to prescribed medication schedules are key."
            )
        elif 'blood pressure' in lower_prompt or 'hypertension' in lower_prompt:
            response_text = (
                "### General Information on Blood Pressure (Hypertension):\n\n"
                "- **Normal Range:** Generally under 120/80 mmHg.\n"
                "- **Common Medications:** Telmisartan, Amlodipine, Losartan, and Beta-blockers as prescribed by a physician.\n"
                "- **Lifestyle Management:** Limit dietary sodium (salt), manage stress, maintain physical activity, and avoid smoking."
            )
        else:
            response_text = (
                f"### MediAI Healthcare Assistant\n\n"
                f"Hello! I can provide general information about medications in our catalog, active ingredients, dosage forms, "
                f"side effect profiles, and general wellness guidance.\n\n"
                f"**You can ask me about:**\n"
                f"- Specific medicines (e.g., *'What is Amoxicillin used for?'*, *'Paracetamol dosage'*)\n"
                f"- OTC products for fever, allergies, colds, pain relief\n"
                f"- How to upload prescriptions at MediCare\n"
                f"- Understanding medical terminology (e.g., *'What is an NSAID?'*, *'What does statin mean?'*)"
            )

        return Response({
            'response': response_text,
            'disclaimer': DISCLAIMER,
            'matched_medicine': serialize_doc(matched_med) if matched_med else None
        }, status=status.HTTP_200_OK)
