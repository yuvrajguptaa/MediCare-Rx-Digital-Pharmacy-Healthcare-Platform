import os
import sys
import django
import datetime
import random
from bson import ObjectId

# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

from backend_core.db import get_db
from backend_core.auth_utils import hash_password


def seed_database():
    db = get_db()
    print("🌱 Starting MediCare Database Seeding...")

    # Drop existing collections to ensure fresh clean state
    db.users.drop()
    db.medicines.drop()
    db.categories.drop()
    db.carts.drop()
    db.wishlists.drop()
    db.addresses.drop()
    db.prescriptions.drop()
    db.orders.drop()
    db.payments.drop()
    db.coupons.drop()
    db.reviews.drop()
    db.notifications.drop()

    print("🧹 Cleared existing collections.")

    # 1. CATEGORIES (10 Categories)
    categories_data = [
        {
            "name": "Antibiotics & Anti-Infectives",
            "slug": "antibiotics",
            "description": "Essential antibacterial, antifungal, and antiviral medications for infection care.",
            "icon": "ShieldCheck",
            "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Pain Relief & Analgesics",
            "slug": "pain-relief",
            "description": "Fast-acting relief for headaches, body aches, arthritis, fever, and inflammation.",
            "icon": "Zap",
            "image": "https://images.unsplash.com/photo-1550572017-ed200f5e5a43?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Cardiovascular & Heart",
            "slug": "cardiovascular",
            "description": "Medications for blood pressure management, cholesterol regulation, and cardiac wellness.",
            "icon": "HeartPulse",
            "image": "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Diabetes Care",
            "slug": "diabetes",
            "description": "Oral hypoglycemics, insulin aids, test strips, and glucose stabilization solutions.",
            "icon": "Activity",
            "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Dermatology & Skin Care",
            "slug": "dermatology",
            "description": "Topical ointments, acne therapies, eczema treatments, and protective lotions.",
            "icon": "Sparkles",
            "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Vitamins & Supplements",
            "slug": "vitamins-supplements",
            "description": "Multivitamins, immunity boosters, calcium, vitamin D3, and wellness nutrition.",
            "icon": "Sun",
            "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Respiratory & Allergy",
            "slug": "respiratory",
            "description": "Inhalers, antihistamines, cough syrups, and decongestants for clear breathing.",
            "icon": "Wind",
            "image": "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Gastrointestinal & Digestive",
            "slug": "gastrointestinal",
            "description": "Antacids, proton pump inhibitors, probiotics, and digestive enzyme formulations.",
            "icon": "Smile",
            "image": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Mental Health & Neurological",
            "slug": "mental-health",
            "description": "Prescription cognitive support, anti-anxiety therapeutics, and neuro-restoratives.",
            "icon": "Brain",
            "image": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Eye, Ear & Personal Care",
            "slug": "eye-ear-care",
            "description": "Lubricating eye drops, anti-infective ear drops, and specialized personal hygiene.",
            "icon": "Eye",
            "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=60",
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        }
    ]
    db.categories.insert_many(categories_data)
    print("✅ Seeded 10 Categories.")

    # 2. USERS (Admin, Pharmacist, and Customer accounts)
    common_pwd = hash_password("Password123!")

    users_data = [
        # 3 Staff / Demo Admins
        {
            "email": "admin@medicare.com",
            "password_hash": common_pwd,
            "first_name": "Dr. Sarah",
            "last_name": "Jenkins",
            "phone": "+91 98765 43210",
            "role": "ADMIN",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin_sarah",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=90),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "pharmacist@medicare.com",
            "password_hash": common_pwd,
            "first_name": "Rajesh",
            "last_name": "Sharma",
            "phone": "+91 98123 45678",
            "role": "PHARMACIST",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=pharmacist_rajesh",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=80),
            "updated_at": datetime.datetime.utcnow()
        },
        # 3 Delivery Partners
        {
            "email": "delivery@medicare.com",
            "password_hash": common_pwd,
            "first_name": "Amit",
            "last_name": "Kumar",
            "phone": "+91 98980 11223",
            "role": "DELIVERY_PARTNER",
            "vehicle": "Honda Activa 6G (MH-02-CD-4589)",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=delivery_amit",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=70),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "delivery2@medicare.com",
            "password_hash": common_pwd,
            "first_name": "Rahul",
            "last_name": "Singh",
            "phone": "+91 98765 22334",
            "role": "DELIVERY_PARTNER",
            "vehicle": "TVS Jupiter (MH-01-AB-1234)",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=delivery_rahul",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=65),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "delivery3@medicare.com",
            "password_hash": common_pwd,
            "first_name": "Mohit",
            "last_name": "Sharma",
            "phone": "+91 98112 33445",
            "role": "DELIVERY_PARTNER",
            "vehicle": "Hero Splendor Plus (MH-03-EF-7890)",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=delivery_mohit",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=60),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "user@medicare.com",
            "password_hash": common_pwd,
            "first_name": "Aarav",
            "last_name": "Patel",
            "phone": "+91 97654 32109",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=aarav_patel",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=60),
            "updated_at": datetime.datetime.utcnow()
        },
        # 10 Customers
        {
            "email": "priya.sharma@example.com",
            "password_hash": common_pwd,
            "first_name": "Priya",
            "last_name": "Sharma",
            "phone": "+91 98234 56781",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=priya_sharma",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=45),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "rohit.verma@example.com",
            "password_hash": common_pwd,
            "first_name": "Rohit",
            "last_name": "Verma",
            "phone": "+91 98345 67892",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=rohit_verma",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=40),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "ananya.singh@example.com",
            "password_hash": common_pwd,
            "first_name": "Ananya",
            "last_name": "Singh",
            "phone": "+91 98456 78903",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya_singh",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=35),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "vikram.malhotra@example.com",
            "password_hash": common_pwd,
            "first_name": "Vikram",
            "last_name": "Malhotra",
            "phone": "+91 98567 89014",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=vikram_malhotra",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=30),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "neha.gupta@example.com",
            "password_hash": common_pwd,
            "first_name": "Neha",
            "last_name": "Gupta",
            "phone": "+91 98678 90125",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=neha_gupta",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=25),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "amit.joshi@example.com",
            "password_hash": common_pwd,
            "first_name": "Amit",
            "last_name": "Joshi",
            "phone": "+91 98789 01236",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=amit_joshi",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=20),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "kavita.deshmukh@example.com",
            "password_hash": common_pwd,
            "first_name": "Kavita",
            "last_name": "Deshmukh",
            "phone": "+91 98890 12347",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=kavita_deshmukh",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=15),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "siddharth.nair@example.com",
            "password_hash": common_pwd,
            "first_name": "Siddharth",
            "last_name": "Nair",
            "phone": "+91 98901 23458",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=siddharth_nair",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=10),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "deepa.mehta@example.com",
            "password_hash": common_pwd,
            "first_name": "Deepa",
            "last_name": "Mehta",
            "phone": "+91 99012 34569",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=deepa_mehta",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=5),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "email": "karan.kapoor@example.com",
            "password_hash": common_pwd,
            "first_name": "Karan",
            "last_name": "Kapoor",
            "phone": "+91 99123 45670",
            "role": "USER",
            "is_active": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=karan_kapoor",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=2),
            "updated_at": datetime.datetime.utcnow()
        }
    ]

    res_users = db.users.insert_many(users_data)
    user_ids = [str(uid) for uid in res_users.inserted_ids]
    demo_user_id = user_ids[2] # Aarav Patel (user@medicare.com)
    print(f"✅ Seeded {len(users_data)} Users (3 Admin/Staff, 10 Customers).")

    # 3. USER ADDRESSES & CARTS
    address_docs = [
        {
            "user_id": demo_user_id,
            "full_name": "Aarav Patel",
            "phone": "+91 97654 32109",
            "street_address": "402, Sunshine Heights, Linking Road",
            "apartment": "Flat 402, 4th Floor",
            "city": "Mumbai",
            "state": "Maharashtra",
            "postal_code": "400050",
            "country": "India",
            "address_type": "HOME",
            "is_default": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "user_id": demo_user_id,
            "full_name": "Aarav Patel (Office)",
            "phone": "+91 97654 32109",
            "street_address": "Tower B, Cyber City, DLF Phase 2",
            "apartment": "Suite 801",
            "city": "Gurugram",
            "state": "Haryana",
            "postal_code": "122002",
            "country": "India",
            "address_type": "WORK",
            "is_default": False,
            "created_at": datetime.datetime.utcnow()
        }
    ]
    for uid in user_ids[3:]:
        address_docs.append({
            "user_id": uid,
            "full_name": "Customer User",
            "phone": "+91 98000 11111",
            "street_address": "12, Park Street",
            "apartment": "Block A",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560001",
            "country": "India",
            "address_type": "HOME",
            "is_default": True,
            "created_at": datetime.datetime.utcnow()
        })
    db.addresses.insert_many(address_docs)

    for uid in user_ids:
        db.carts.insert_one({'user_id': uid, 'items': [], 'updated_at': datetime.datetime.utcnow()})
        db.wishlists.insert_one({'user_id': uid, 'medicine_ids': [], 'updated_at': datetime.datetime.utcnow()})

    # 4. MEDICINES (50 Realistic Medicines across 10 Categories)
    med_raw = [
        # Antibiotics (5)
        ("Augmentin 625 Duo", "Amoxicillin and Potassium Clavulanate", "GSK", "Antibiotics & Anti-Infectives", 
         "Effective combination antibiotic for respiratory tract, ear, sinus, and soft tissue bacterial infections.", 
         "Bacterial infections, Bronchitis, Sinusitis, Otitis media", "Amoxicillin 500mg + Clavulanic Acid 125mg", "Tablet", "625 mg", 223.50, 189.90, 85, "GSK Pharmaceuticals", True, "2027-08-31", 4.8, 142),
        
        ("Azithral 500", "Azithromycin", "Alembic", "Antibiotics & Anti-Infectives",
         "Macrolide antibiotic used for respiratory tract infections, tonsillitis, and skin infections.",
         "Throat infection, Pneumonia, Typhoid", "Azithromycin 500mg", "Tablet", "500 mg", 132.00, 105.00, 120, "Alembic Pharma", True, "2027-11-30", 4.7, 98),

        ("Ciplox 500", "Ciprofloxacin", "Cipla", "Antibiotics & Anti-Infectives",
         "Fluoroquinolone broad-spectrum antibacterial for urinary, gastrointestinal, and bone infections.",
         "UTI, Typhoid, Diarrhea, Joint infections", "Ciprofloxacin 500mg", "Tablet", "500 mg", 45.00, 38.00, 95, "Cipla Ltd", True, "2027-09-30", 4.6, 75),

        ("Taxim-O 200", "Cefixime", "Alkem", "Antibiotics & Anti-Infectives",
         "Oral third-generation cephalosporin for severe respiratory and ENT infections.",
         "Typhoid, Bronchitis, Urinary tract infections", "Cefixime 200mg", "Tablet", "200 mg", 168.00, 142.00, 60, "Alkem Laboratories", True, "2028-01-31", 4.7, 62),

        ("Flagyl 400", "Metronidazole", "Abbott", "Antibiotics & Anti-Infectives",
         "Anti-protozoal and anaerobic antibiotic for gastrointestinal and dental amoebiasis.",
         "Amoebiasis, Dental abscess, Bacterial vaginosis", "Metronidazole 400mg", "Tablet", "400 mg", 28.00, 22.00, 150, "Abbott Healthcare", True, "2027-10-31", 4.5, 88),

        # Pain Relief & Analgesics (6)
        ("Dolo 650", "Paracetamol", "Micro Labs", "Pain Relief & Analgesics",
         "Fast and reliable antipyretic & analgesic for body pain, headache, and fever.",
         "Fever, Headache, Muscle pain, Post-vaccine discomfort", "Paracetamol 650mg", "Tablet", "650 mg", 34.00, 29.00, 300, "Micro Labs Ltd", False, "2028-06-30", 4.9, 540),

        ("Combiflam", "Ibuprofen and Paracetamol", "Sanofi", "Pain Relief & Analgesics",
         "Dual-action formula combining analgesic, anti-inflammatory, and antipyretic properties.",
         "Dental pain, Muscle sprain, Menstrual cramps, Joint pain", "Ibuprofen 400mg + Paracetamol 325mg", "Tablet", "725 mg", 46.50, 39.50, 210, "Sanofi India", False, "2027-12-31", 4.8, 310),

        ("Zerodol-SP", "Aceclofenac, Paracetamol & Serratiopeptidase", "Ipca", "Pain Relief & Analgesics",
         "Triple combination for acute swelling, post-surgical pain, and inflammation.",
         "Post-operative swelling, Arthritis, Severe backache", "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg", "Tablet", "440 mg", 125.00, 102.00, 110, "Ipca Laboratories", True, "2027-09-30", 4.7, 180),

        ("Volini Pain Relief Gel", "Diclofenac Diethylamine", "Sun Pharma", "Pain Relief & Analgesics",
         "Topical deep-penetrating gel for quick relief from back, neck, and joint stiffness.",
         "Sprains, Strains, Backache, Sciatica", "Diclofenac 1.16% w/w + Methyl Salicylate", "Gel", "75 g", 215.00, 175.00, 80, "Sun Pharma", False, "2027-10-31", 4.8, 220),

        ("Meftal-Spas", "Mefenamic Acid and Dicyclomine", "Blue Cross", "Pain Relief & Analgesics",
         "Antispasmodic and analgesic formulation for abdominal cramps and menstrual pain.",
         "Menstrual colic, Intestinal cramps, Spasmodic dysmenorrhea", "Mefenamic Acid 250mg + Dicyclomine 10mg", "Tablet", "260 mg", 52.00, 42.00, 140, "Blue Cross Labs", True, "2027-11-30", 4.6, 95),

        ("Saridon Headache Relief", "Propyphenazone, Paracetamol & Caffeine", "Piramal", "Pain Relief & Analgesics",
         "Triple-action rapid relief tablet specially formulated for severe headaches and migraines.",
         "Tension headache, Migraine, Toothache", "Propyphenazone 150mg + Paracetamol 250mg + Caffeine 50mg", "Tablet", "450 mg", 48.00, 40.00, 190, "Piramal Pharma", False, "2028-02-28", 4.7, 160),

        # Cardiovascular & Heart (5)
        ("Telma 40", "Telmisartan", "Glenmark", "Cardiovascular & Heart",
         "Angiotensin II receptor antagonist (ARB) for controlling essential hypertension.",
         "High blood pressure, Cardiovascular risk reduction", "Telmisartan 40mg", "Tablet", "40 mg", 145.00, 122.00, 90, "Glenmark Pharma", True, "2027-10-31", 4.8, 115),

        ("Lipitor / Atorva 20", "Atorvastatin", "Zydus", "Cardiovascular & Heart",
         "HMG-CoA reductase inhibitor for reducing LDL cholesterol and prevention of atherosclerosis.",
         "Hyperlipidemia, Coronary artery disease prevention", "Atorvastatin 20mg", "Tablet", "20 mg", 210.00, 175.00, 105, "Zydus Healthcare", True, "2028-03-31", 4.9, 140),

        ("Amlong 5", "Amlodipine", "Micro Labs", "Cardiovascular & Heart",
         "Calcium channel blocker for stable angina and hypertension management.",
         "Hypertension, Vasospastic angina", "Amlodipine Besylate 5mg", "Tablet", "5 mg", 39.00, 31.00, 160, "Micro Labs", True, "2027-12-31", 4.7, 82),

        ("Ecosprin 75", "Aspirin", "USV", "Cardiovascular & Heart",
         "Low-dose antiplatelet medication to prevent blood clots, heart attacks, and ischemic strokes.",
         "Prevention of myocardial infarction, Blood thinner", "Aspirin 75mg (Enteric Coated)", "Tablet", "75 mg", 6.50, 5.20, 400, "USV Private Ltd", True, "2028-05-31", 4.9, 390),

        ("Concor 5", "Bisoprolol", "Merck", "Cardiovascular & Heart",
         "Cardioselective beta-blocker for heart rate control, hypertension, and congestive heart failure.",
         "Hypertension, Heart failure, Arrhythmia", "Bisoprolol Fumarate 5mg", "Tablet", "5 mg", 185.00, 155.00, 75, "Merck Healthcare", True, "2027-08-31", 4.6, 55),

        # Diabetes Care (5)
        ("Glycomet-GP 2", "Metformin and Glimepiride", "USV", "Diabetes Care",
         "Combination oral hypoglycemic for adult patients with type 2 diabetes.",
         "Type 2 Diabetes Mellitus glycemic control", "Glimepiride 2mg + Metformin 500mg SR", "Tablet", "502 mg", 152.00, 128.00, 130, "USV Private Ltd", True, "2028-01-31", 4.8, 195),

        ("Januvia 100", "Sitagliptin", "MSD", "Diabetes Care",
         "DPP-4 inhibitor enhancing insulin synthesis and lowering glucagon levels postprandially.",
         "Type 2 Diabetes, High HbA1c control", "Sitagliptin Phosphate 100mg", "Tablet", "100 mg", 450.00, 390.00, 50, "MSD Pharmaceuticals", True, "2027-11-30", 4.9, 88),

        ("Galvus Met 50/500", "Vildagliptin and Metformin", "Novartis", "Diabetes Care",
         "Synergistic dual action medication for effective and smooth glycemic management.",
         "Type 2 Diabetes blood sugar regulation", "Vildagliptin 50mg + Metformin 500mg", "Tablet", "550 mg", 295.00, 245.00, 65, "Novartis India", True, "2027-12-31", 4.8, 70),

        ("OneTouch Verio Test Strips", "Glucose Test Strips", "Lifescan", "Diabetes Care",
         "High accuracy blood glucose monitoring test strips for home glucometers (50 Count).",
         "Self-monitoring of blood glucose", "Glucose dehydrogenase reagent strips", "Pack", "50 Strips", 1150.00, 949.00, 45, "Lifescan Medical", False, "2027-09-30", 4.7, 130),

        ("Lantus Solostar Insulin Pen", "Insulin Glargine", "Sanofi", "Diabetes Care",
         "24-hour long-acting basal analog insulin injection in a convenient prefilled pen.",
         "Diabetes Mellitus Type 1 and Type 2 basal insulin", "Insulin Glargine 100 IU/ml", "Injection", "3 ml", 780.00, 690.00, 35, "Sanofi Aventis", True, "2027-06-30", 4.9, 110),

        # Dermatology & Skin Care (5)
        ("Betnovate-N Cream", "Betamethasone and Neomycin", "GSK", "Dermatology & Skin Care",
         "Topical anti-inflammatory corticosteroid and antibacterial cream for eczema and skin allergies.",
         "Eczema, Psoriasis, Dermatitis, Bacterial skin lesions", "Betamethasone 0.1% + Neomycin 0.5%", "Cream", "20 g", 56.00, 47.00, 180, "GSK", True, "2027-10-31", 4.7, 210),

        ("Candid-B Cream", "Clotrimazole and Beclomethasone", "Glenmark", "Dermatology & Skin Care",
         "Antifungal and steroid combination for fungal infections with itching and erythema.",
         "Ringworm, Athlete's foot, Fungal dermatitis", "Clotrimazole 1% + Beclomethasone 0.025%", "Cream", "30 g", 165.00, 138.00, 120, "Glenmark", False, "2028-02-28", 4.8, 175),

        ("Sebamed Clear Face Gel", "Hyaluronic Acid & Aloe", "Sebamed", "Dermatology & Skin Care",
         "pH 5.5 balanced oil-free moisturizer for acne-prone sensitive skin.",
         "Acne control, Skin barrier hydration, Blackheads", "Hyaluronic Acid, Panthenol, Allantoin", "Gel", "50 ml", 480.00, 410.00, 70, "Sebapharma", False, "2028-04-30", 4.8, 90),

        ("Deriva-CMS Gel", "Adapalene and Clindamycin", "Glenmark", "Dermatology & Skin Care",
         "Retinoid and antibiotic gel targeting comedones and inflammatory acne vulgaris.",
         "Acne vulgaris, Pimples, Pore clearing", "Adapalene 0.1% + Clindamycin 1%", "Gel", "15 g", 320.00, 275.00, 55, "Glenmark Pharma", True, "2027-08-31", 4.6, 65),

        ("Cetaphil Gentle Skin Cleanser", "Niacinamide and Panthenol", "Galderma", "Dermatology & Skin Care",
         "Dermatologist-recommended non-foaming hydrating cleanser for sensitive skin.",
         "Daily facial cleansing, Rosacea, Dry skin", "Hydrating Glycerin, Panthenol, Niacinamide", "Lotion", "125 ml", 399.00, 339.00, 95, "Galderma", False, "2028-05-31", 4.9, 290),

        # Vitamins & Supplements (6)
        ("Becosules Z Capsules", "B-Complex, Vitamin C and Zinc", "Pfizer", "Vitamins & Supplements",
         "Complete therapeutic daily multivitamin formulation for energy and mouth ulcer healing.",
         "Vitamin B deficiency, Fatigue, Mouth ulcers, Immune defense", "B-Complex + Vitamin C 150mg + Zinc Sulphate", "Capsule", "30 Caps", 58.00, 49.00, 250, "Pfizer India", False, "2028-07-31", 4.8, 480),

        ("Supradyn Daily Multivitamin", "Minerals & Trace Elements", "Bayer", "Vitamins & Supplements",
         "Comprehensive daily nutrition supplement with 12 vitamins and 5 trace minerals.",
         "Daily stamina, General vitality, Immunity support", "12 Vitamins + 5 Minerals + Trace Elements", "Tablet", "30 Tabs", 120.00, 99.00, 220, "Bayer Healthcare", False, "2028-04-30", 4.7, 340),

        ("Shelcal 500", "Calcium and Vitamin D3", "Torrent", "Vitamins & Supplements",
         "High bioavailable calcium with activated Cholecalciferol for bone and teeth mineral density.",
         "Osteoporosis prevention, Bone strength, Pregnancy calcium", "Calcium Carbonate 500mg + Vitamin D3 250 IU", "Tablet", "15 Tabs", 131.00, 110.00, 180, "Torrent Pharma", False, "2028-06-30", 4.9, 260),

        ("Limcee 500 Chewable", "Vitamin C (Ascorbic Acid)", "Abbott", "Vitamins & Supplements",
         "Tasty orange-flavored antioxidant vitamin C tablets for collagen synthesis and immunity.",
         "Immune boost, Collagen building, Wound healing", "Ascorbic Acid 500mg (Chewable)", "Tablet", "15 Tabs", 26.00, 21.00, 350, "Abbott Healthcare", False, "2028-08-31", 4.8, 410),

        ("Revital H Daily Health", "Ginseng, Vitamins & Minerals", "Sun Pharma", "Vitamins & Supplements",
         "Energizing formula with Korean Ginseng to fight mental and physical fatigue.",
         "Energy boost, Mental focus, Physical endurance", "Ginseng Extract + 10 Vitamins + 9 Minerals", "Capsule", "60 Caps", 550.00, 449.00, 110, "Sun Pharma", False, "2028-03-31", 4.7, 215),

        ("Neurobion Forte", "High Potency B-Vitamins", "Procter & Gamble", "Vitamins & Supplements",
         "Therapeutic neurotropic B-vitamin complex for nerve regeneration and tingling sensations.",
         "Peripheral neuropathy, Nerve health, Sciatic tingling", "Vitamin B1 10mg + B6 3mg + B12 15mcg", "Tablet", "30 Tabs", 42.00, 35.00, 200, "P&G Health", False, "2028-09-30", 4.8, 305),

        # Respiratory & Allergy (5)
        ("Allegra 120", "Fexofenadine", "Sanofi", "Respiratory & Allergy",
         "Non-sedating antihistamine for seasonal allergic rhinitis, sneezing, and chronic urticaria.",
         "Allergic rhinitis, Hay fever, Urticaria, Sneezing", "Fexofenadine Hydrochloride 120mg", "Tablet", "120 mg", 218.00, 185.00, 140, "Sanofi India", False, "2027-11-30", 4.8, 190),

        ("Montair-LC", "Montelukast and Levocetirizine", "Cipla", "Respiratory & Allergy",
         "Leukotriene receptor antagonist and antihistamine for asthma prevention and severe allergies.",
         "Allergic asthma, Year-round rhinitis, Chest congestion", "Montelukast 10mg + Levocetirizine 5mg", "Tablet", "15 mg", 240.00, 199.00, 115, "Cipla Ltd", True, "2028-01-31", 4.8, 160),

        ("Ascoril D Plus Syrup", "Dextromethorphan and Phenylephrine", "Glenmark", "Respiratory & Allergy",
         "Triple combination sugar-free cough syrup for dry irritating cough and blocked sinuses.",
         "Dry cough, Nasal congestion, Pharyngeal tickle", "Dextromethorphan 10mg + Phenylephrine 5mg", "Syrup", "100 ml", 138.00, 115.00, 85, "Glenmark", False, "2027-10-31", 4.7, 130),

        ("Asthalin Inhaler 100mcg", "Salbutamol (Albuterol)", "Cipla", "Respiratory & Allergy",
         "Fast-acting rescue bronchodilator for instant relief from acute bronchospasms and wheezing.",
         "Asthma rescue, COPD bronchospasm, Exercise-induced wheeze", "Salbutamol 100 mcg per actuation (200 MDI)", "Inhaler", "200 Puffs", 175.00, 149.00, 70, "Cipla Ltd", True, "2027-09-30", 4.9, 210),

        ("Otrivin Oxy Fast Relief", "Oxymetazoline", "GSK", "Respiratory & Allergy",
         "Fast-acting nasal decongestant spray clearing blocked nose within 25 seconds.",
         "Nasal congestion, Sinusitis blockage, Cold relief", "Oxymetazoline Hydrochloride 0.05%", "Spray", "10 ml", 112.00, 95.00, 130, "GSK Consumer", False, "2027-12-31", 4.6, 175),

        # Gastrointestinal & Digestive (5)
        ("Pantocid 40", "Pantoprazole", "Sun Pharma", "Gastrointestinal & Digestive",
         "Potent proton pump inhibitor for hyperacidity, GERD, and healing of peptic ulcers.",
         "Acid reflux, GERD, Heartburn, Gastric ulcers", "Pantoprazole Sodium 40mg", "Tablet", "40 mg", 162.00, 135.00, 160, "Sun Pharma", True, "2028-03-31", 4.8, 230),

        ("Digene Gel Mint Flavour", "Magnesium and Aluminium Hydroxide", "Abbott", "Gastrointestinal & Digestive",
         "Sugar-free soothing antacid suspension providing immediate relief from acidity and gas.",
         "Acidity, Heartburn, Indigestion, Bloating", "Magnesium Hydroxide + Dried Aluminium Hydroxide Gel + Simethicone", "Syrup", "200 ml", 155.00, 129.00, 190, "Abbott Healthcare", False, "2028-02-28", 4.9, 380),

        ("Econorm 250mg", "Saccharomyces Boulardii", "Dr. Reddy's", "Gastrointestinal & Digestive",
         "Probiotic yeast capsules restoring gut flora disrupted by antibiotic therapies or diarrhea.",
         "Antibiotic-associated diarrhea, Gut microbiota recovery", "Lyophilized Saccharomyces boulardii 250mg", "Capsule", "250 mg", 345.00, 290.00, 80, "Dr. Reddy's Laboratories", False, "2027-11-30", 4.7, 95),

        ("Cremaffin Syrup", "Liquid Paraffin and Milk of Magnesia", "Abbott", "Gastrointestinal & Digestive",
         "Gentle osmotic laxative providing smooth overnight relief from acute and chronic constipation.",
         "Constipation relief, Piles pain reduction", "Liquid Paraffin + Milk of Magnesia", "Syrup", "225 ml", 280.00, 235.00, 95, "Abbott Healthcare", False, "2027-10-31", 4.8, 140),

        ("Pudinhara Pearls", "Mentha Oil and Spearmint", "Dabur", "Gastrointestinal & Digestive",
         "Ayurvedic cooling herbal pearls for instant herbal relief from stomach ache and gas.",
         "Stomach ache, Gas, Flatulence, Indigestion", "Pudina Satva (Menthol extract)", "Capsule", "10 Pearls", 35.00, 30.00, 260, "Dabur India", False, "2028-06-30", 4.8, 290),

        # Mental Health & Neurological (4)
        ("Nexito 10", "Escitalopram", "Sun Pharma", "Mental Health & Neurological",
         "Selective serotonin reuptake inhibitor (SSRI) for major depression and anxiety disorders.",
         "Depression, Generalized anxiety disorder, Panic attacks", "Escitalopram Oxalate 10mg", "Tablet", "10 mg", 110.00, 92.00, 60, "Sun Pharma", True, "2027-09-30", 4.7, 75),

        ("Clonafit 0.5", "Clonazepam", "Mankind", "Mental Health & Neurological",
         "Benzodiazepine anxiolytic and anticonvulsant for acute panic disorders and seizures.",
         "Panic attacks, Insomnia associated with anxiety", "Clonazepam 0.5mg", "Tablet", "0.5 mg", 55.00, 44.00, 40, "Mankind Pharma", True, "2027-08-31", 4.6, 50),

        ("Pregabalin 75", "Pregabalin", "Torrent", "Mental Health & Neurological",
         "GABA analog for diabetic neuropathic pain, fibromyalgia, and spinal cord injuries.",
         "Neuropathic pain, Fibromyalgia, Post-herpetic neuralgia", "Pregabalin 75mg", "Capsule", "75 mg", 190.00, 159.00, 50, "Torrent Pharma", True, "2027-12-31", 4.7, 65),

        ("Brahmi Vati Ayurvedic", "Bacopa Monnieri & Shankhpushpi", "Baidyanath", "Mental Health & Neurological",
         "Traditional classical herbal formulation supporting memory, cognitive clarity, and calm focus.",
         "Mental fatigue, Memory retention, Stress relief", "Brahmi extract + Shankhpushpi + Swarna Bhasma", "Tablet", "60 Tabs", 295.00, 245.00, 85, "Baidyanath", False, "2028-05-31", 4.7, 110),

        # Eye, Ear & Personal Care (4)
        ("Refresh Tears Eye Drops", "Carboxymethylcellulose Sodium", "Allergan", "Eye, Ear & Personal Care",
         "Sterile lubricating artificial tears soothing dry, irritated, screen-fatigued eyes.",
         "Dry eyes, Eye fatigue from screens, Burning sensation", "Carboxymethylcellulose 0.5% w/v", "Drops", "10 ml", 152.00, 128.00, 170, "Allergan Healthcare", False, "2027-10-31", 4.9, 310),

        ("Ciplox Eye/Ear Drops", "Ciprofloxacin", "Cipla", "Eye, Ear & Personal Care",
         "Antibacterial drops for conjunctivitis (pink eye), corneal ulcers, and outer ear canal infections.",
         "Conjunctivitis, Stye, Bacterial otitis externa", "Ciprofloxacin Hydrochloride 0.3% w/v", "Drops", "10 ml", 19.50, 16.00, 220, "Cipla Ltd", True, "2027-08-31", 4.7, 140),

        ("Solu-Wax Ear Drops", "Paradichlorobenzene and Benzocaine", "Cipla", "Eye, Ear & Personal Care",
         "Ear wax dissolving drops with local anesthetic to painlessly clear impacted cerumen.",
         "Impacted ear wax, Ear fullness, Painless cerumen removal", "Paradichlorobenzene 2% + Benzocaine 2.7%", "Drops", "10 ml", 88.00, 74.00, 100, "Cipla Ltd", False, "2027-11-30", 4.6, 85),

        ("Dettol Antiseptic Liquid", "Chloroxylenol", "Reckitt", "Eye, Ear & Personal Care",
         "Hospital-grade trusted antiseptic disinfectant for first aid wounds, cuts, and hygiene.",
         "Wound antiseptic, First aid cleansing, Surface hygiene", "Chloroxylenol (PCMX) 4.8% w/v", "Liquid", "550 ml", 220.00, 189.00, 150, "Reckitt Benckiser", False, "2028-09-30", 4.9, 620)
    ]

    # Helper sample images for each category
    cat_images = {
        "Antibiotics & Anti-Infectives": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=70",
        "Pain Relief & Analgesics": "https://images.unsplash.com/photo-1550572017-ed200f5e5a43?w=600&auto=format&fit=crop&q=70",
        "Cardiovascular & Heart": "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop&q=70",
        "Diabetes Care": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=70",
        "Dermatology & Skin Care": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=70",
        "Vitamins & Supplements": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=70",
        "Respiratory & Allergy": "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&auto=format&fit=crop&q=70",
        "Gastrointestinal & Digestive": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=70",
        "Mental Health & Neurological": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=70",
        "Eye, Ear & Personal Care": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=70"
    }

    medicines_docs = []
    for (name, gen_name, brand, cat, desc, uses, ing, form, str_val, mrp, sp, stock, mfr, rx, exp, rat, rat_cnt) in med_raw:
        disc = round(((mrp - sp) / mrp) * 100) if mrp > sp else 0
        img = cat_images.get(cat, "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=70")
        
        doc = {
            "name": name,
            "generic_name": gen_name,
            "brand": brand,
            "category": cat,
            "description": desc,
            "uses": uses,
            "ingredients": ing,
            "dosage_form": form,
            "strength": str_val,
            "mrp": mrp,
            "selling_price": sp,
            "discount": disc,
            "stock": stock,
            "sku": f"MED-{random.randint(10000, 99999)}",
            "manufacturer": mfr,
            "prescription_required": rx,
            "images": [img],
            "expiry_date": exp,
            "ratings_avg": rat,
            "ratings_count": rat_cnt,
            "is_active": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(10, 100)),
            "updated_at": datetime.datetime.utcnow()
        }
        medicines_docs.append(doc)

    res_meds = db.medicines.insert_many(medicines_docs)
    medicine_ids = [str(mid) for mid in res_meds.inserted_ids]
    print(f"✅ Seeded {len(medicines_docs)} Medicines across 10 categories.")

    # 5. COUPONS (5 Coupons)
    coupons_data = [
        {
            "code": "HEALTH10",
            "discount_percentage": 10.0,
            "min_order_amount": 300.0,
            "max_discount_amount": 100.0,
            "expiry_date": "2028-12-31",
            "is_active": True,
            "usage_count": 42,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "code": "PHARMA20",
            "discount_percentage": 20.0,
            "min_order_amount": 800.0,
            "max_discount_amount": 300.0,
            "expiry_date": "2028-12-31",
            "is_active": True,
            "usage_count": 89,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "code": "FIRSTMED50",
            "discount_percentage": 25.0,
            "min_order_amount": 500.0,
            "max_discount_amount": 250.0,
            "expiry_date": "2028-12-31",
            "is_active": True,
            "usage_count": 120,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "code": "SAVE15",
            "discount_percentage": 15.0,
            "min_order_amount": 600.0,
            "max_discount_amount": 150.0,
            "expiry_date": "2028-12-31",
            "is_active": True,
            "usage_count": 55,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "code": "FLAT100",
            "discount_percentage": 12.0,
            "min_order_amount": 1000.0,
            "max_discount_amount": 400.0,
            "expiry_date": "2028-12-31",
            "is_active": True,
            "usage_count": 31,
            "created_at": datetime.datetime.utcnow()
        }
    ]
    db.coupons.insert_many(coupons_data)
    print("✅ Seeded 5 Active Coupons.")

    # 6. PRESCRIPTIONS (5 Sample Prescriptions with various statuses)
    prescriptions_data = [
        {
            "user_id": demo_user_id,
            "user_email": "user@medicare.com",
            "patient_name": "Aarav Patel",
            "doctor_name": "Dr. Vivek Mehra (MBBS, MD - Reg #78291)",
            "notes": "Prescription for Augmentin 625 & Montair-LC for chest infection.",
            "file_url": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=75",
            "file_name": "Dr_Mehra_Prescription_Oct2026.pdf",
            "file_type": "PDF",
            "status": "APPROVED",
            "review_notes": "Verified against doctor registry. Valid dosage and duration approved.",
            "reviewed_by": "Rajesh Sharma (PHARMACIST)",
            "reviewed_at": datetime.datetime.utcnow() - datetime.timedelta(days=2),
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=3),
            "updated_at": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        },
        {
            "user_id": demo_user_id,
            "user_email": "user@medicare.com",
            "patient_name": "Aarav Patel",
            "doctor_name": "Dr. Anita Rao (Cardiologist)",
            "notes": "Routine Telma 40 & Lipitor 20 quarterly refill.",
            "file_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=75",
            "file_name": "Cardio_Refill_Prescription.jpg",
            "file_type": "JPG",
            "status": "APPROVED",
            "review_notes": "Verified. Ongoing maintenance prescription.",
            "reviewed_by": "Rajesh Sharma (PHARMACIST)",
            "reviewed_at": datetime.datetime.utcnow() - datetime.timedelta(days=10),
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=11),
            "updated_at": datetime.datetime.utcnow() - datetime.timedelta(days=10)
        },
        {
            "user_id": user_ids[3], # Priya
            "user_email": "priya.sharma@example.com",
            "patient_name": "Priya Sharma",
            "doctor_name": "Dr. Sandeep Kulkarni",
            "notes": "Prescription for Asthalin Inhaler.",
            "file_url": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=75",
            "file_name": "Asthma_Prescription_Priya.pdf",
            "file_type": "PDF",
            "status": "PENDING",
            "review_notes": "",
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=4),
            "updated_at": datetime.datetime.utcnow() - datetime.timedelta(hours=4)
        },
        {
            "user_id": user_ids[4], # Rohit
            "user_email": "rohit.verma@example.com",
            "patient_name": "Rohit Verma",
            "doctor_name": "Dr. K. L. Sharma",
            "notes": "Prescription for Glycomet-GP 2.",
            "file_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=75",
            "file_name": "Diabetes_Rx_Rohit.jpg",
            "file_type": "JPG",
            "status": "PENDING",
            "review_notes": "",
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=1),
            "updated_at": datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        },
        {
            "user_id": user_ids[5], # Ananya
            "user_email": "ananya.singh@example.com",
            "patient_name": "Ananya Singh",
            "doctor_name": "Unclear handwritten note",
            "notes": "Old photo from 2022.",
            "file_url": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=75",
            "file_name": "Old_Prescription.png",
            "file_type": "PNG",
            "status": "REJECTED",
            "review_notes": "Prescription date has expired (> 6 months old). Please upload an updated prescription with doctor's registration number.",
            "reviewed_by": "Dr. Sarah Jenkins (ADMIN)",
            "reviewed_at": datetime.datetime.utcnow() - datetime.timedelta(days=5),
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=6),
            "updated_at": datetime.datetime.utcnow() - datetime.timedelta(days=5)
        }
    ]
    res_rx = db.prescriptions.insert_many(prescriptions_data)
    rx_ids = [str(r) for r in res_rx.inserted_ids]
    print(f"✅ Seeded {len(prescriptions_data)} Prescriptions (Approved, Pending, Rejected).")

    # 7. ORDERS (12 Sample Orders across all lifecycle states)
    orders_data = []
    statuses = [
        'CONFIRMED', 'PACKING', 'READY_FOR_PICKUP', 'ASSIGNED',
        'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERED',
        'CONFIRMED', 'DELIVERED', 'CANCELLED', 'OUT_FOR_DELIVERY'
    ]

    # Find the primary delivery partner
    delivery_rider = db.users.find_one({'email': 'delivery@medicare.com'})
    rider_partner_info = {
        'id': str(delivery_rider['_id']),
        'name': f"{delivery_rider['first_name']} {delivery_rider['last_name']}",
        'phone': delivery_rider['phone'],
        'email': delivery_rider['email'],
        'vehicle': delivery_rider.get('vehicle', 'Honda Activa 6G (MH-02-CD-4589)')
    } if delivery_rider else None

    for i in range(12):
        ord_num = f"ORD-202609-{random.randint(1000, 9999)}"
        cur_status = statuses[i % len(statuses)]
        order_user_id = demo_user_id if i < 4 else user_ids[3 + (i % 7)]
        user_info = db.users.find_one({'_id': ObjectId(order_user_id)})
        
        # Pick 2-3 items
        chosen_sample = random.sample(medicines_docs, random.randint(2, 3))
        items_list = []
        sub_mrp = 0
        sub_selling = 0
        is_packed = cur_status in ['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']

        for it_idx, m in enumerate(chosen_sample):
            q = random.randint(1, 2)
            item_mrp = m['mrp'] * q
            item_sp = m['selling_price'] * q
            sub_mrp += item_mrp
            sub_selling += item_sp
            items_list.append({
                "medicine_id": str(m['_id']) if '_id' in m else medicine_ids[random.randint(0, len(medicine_ids)-1)],
                "name": m['name'],
                "generic_name": m.get('generic_name', ''),
                "brand": m.get('brand', ''),
                "category": m.get('category', ''),
                "image": m['images'][0] if m.get('images') else 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100',
                "mrp": m['mrp'],
                "selling_price": m['selling_price'],
                "discount": m['discount'],
                "quantity": q,
                "stock": m['stock'],
                "is_available": True,
                "prescription_required": m['prescription_required'],
                "item_total_mrp": round(item_mrp, 2),
                "item_total_selling": round(item_sp, 2),
                "packed": is_packed or (cur_status == 'PACKING' and it_idx == 0)
            })

        coupon_disc = 20.0 if i % 2 == 0 else 0.0
        del_fee = 0.0 if sub_selling >= 500 else 40.0
        tot = max(0.0, sub_selling - coupon_disc + del_fee)
        ord_date = datetime.datetime.utcnow() - datetime.timedelta(days=(12 - i))

        history = [
            {"status": "PLACED", "timestamp": ord_date, "note": "Order placed successfully.", "updated_by": "System"}
        ]
        if cur_status in ['CONFIRMED', 'PACKING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']:
            history.append({"status": "CONFIRMED", "timestamp": ord_date + datetime.timedelta(minutes=5), "note": "Order confirmed and verified.", "updated_by": "System"})
        if cur_status in ['PACKING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']:
            history.append({"status": "PACKING", "timestamp": ord_date + datetime.timedelta(minutes=20), "note": "Packing initiated in sterile facility.", "updated_by": "Dr. Sarah"})
        if cur_status in ['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']:
            history.append({"status": "READY_FOR_PICKUP", "timestamp": ord_date + datetime.timedelta(hours=1), "note": "All items packed and sealed. Ready for pickup.", "updated_by": "Rajesh Sharma"})
        if cur_status in ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']:
            history.append({"status": "ASSIGNED", "timestamp": ord_date + datetime.timedelta(hours=1, minutes=15), "note": "Assigned to Amit Kumar (+91 98980 11223).", "updated_by": "Rajesh Sharma"})
        if cur_status in ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']:
            history.append({"status": "PICKED_UP", "timestamp": ord_date + datetime.timedelta(hours=2), "note": "Picked up from pharmacy hub by Amit Kumar.", "updated_by": "Amit Kumar"})
        if cur_status in ['OUT_FOR_DELIVERY', 'DELIVERED']:
            history.append({"status": "OUT_FOR_DELIVERY", "timestamp": ord_date + datetime.timedelta(hours=3), "note": "Out for delivery. Arriving shortly.", "updated_by": "Amit Kumar"})
        if cur_status == 'DELIVERED':
            history.append({"status": "DELIVERED", "timestamp": ord_date + datetime.timedelta(hours=4), "note": "Delivered to recipient via OTP verification.", "updated_by": "Amit Kumar"})
        if cur_status == 'CANCELLED':
            history.append({"status": "CANCELLED", "timestamp": ord_date + datetime.timedelta(minutes=30), "note": "Customer requested order cancellation.", "updated_by": "Customer"})

        has_partner = cur_status in ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']
        partner_obj = rider_partner_info if has_partner else None
        partner_id = str(delivery_rider['_id']) if has_partner and delivery_rider else None

        packed_count = sum(1 for it in items_list if it.get('packed'))
        otp_val = f"{random.randint(1000, 9999)}"

        ord_doc = {
            "order_number": ord_num,
            "user_id": order_user_id,
            "customer_name": f"{user_info['first_name']} {user_info['last_name']}",
            "customer_email": user_info['email'],
            "customer_phone": user_info['phone'],
            "items": items_list,
            "shipping_address": {
                "full_name": f"{user_info['first_name']} {user_info['last_name']}",
                "phone": user_info['phone'],
                "street_address": "402, Sunshine Heights, Linking Road",
                "apartment": "Flat 402",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postal_code": "400050",
                "country": "India"
            },
            "pincode": "400050",
            "city": "Mumbai",
            "state": "Maharashtra",
            "prescription_id": rx_ids[0] if any(it['prescription_required'] for it in items_list) else None,
            "prescription_required": any(it['prescription_required'] for it in items_list),
            "payment_method": "RAZORPAY" if i % 2 == 0 else "COD",
            "payment_status": "PAID" if (i % 2 == 0 or cur_status == 'DELIVERED') else "PENDING",
            "order_status": cur_status,
            "delivery_partner": partner_obj,
            "delivery_partner_id": partner_id,
            "delivery_otp": otp_val,
            "packing_status": {
                "is_fully_packed": is_packed,
                "packed_count": packed_count,
                "total_items": len(items_list),
                "packed_items": []
            },
            "timestamps": {
                "orderPlacedAt": ord_date,
                "confirmedAt": ord_date + datetime.timedelta(minutes=5),
                "packingStartedAt": ord_date + datetime.timedelta(minutes=20) if cur_status in ['PACKING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'] else None,
                "readyForPickupAt": ord_date + datetime.timedelta(hours=1) if cur_status in ['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'] else None,
                "assignedAt": ord_date + datetime.timedelta(hours=1, minutes=15) if has_partner else None,
                "pickedUpAt": ord_date + datetime.timedelta(hours=2) if cur_status in ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'] else None,
                "outForDeliveryAt": ord_date + datetime.timedelta(hours=3) if cur_status in ['OUT_FOR_DELIVERY', 'DELIVERED'] else None,
                "deliveredAt": ord_date + datetime.timedelta(hours=4) if cur_status == 'DELIVERED' else None,
                "cancelledAt": ord_date + datetime.timedelta(minutes=30) if cur_status == 'CANCELLED' else None
            },
            "subtotal_mrp": round(sub_mrp, 2),
            "subtotal_selling": round(sub_selling, 2),
            "mrp_savings": round(max(0, sub_mrp - sub_selling), 2),
            "coupon_code": "HEALTH10" if coupon_disc > 0 else None,
            "coupon_discount": round(coupon_disc, 2),
            "delivery_fee": round(del_fee, 2),
            "tax": 0.0,
            "total_savings": round(max(0, sub_mrp - sub_selling) + coupon_disc, 2),
            "total_amount": round(tot, 2),
            "customer_notes": "Please deliver between 10am-5pm.",
            "status_history": history,
            "created_at": ord_date,
            "updated_at": ord_date + datetime.timedelta(hours=24 if cur_status == 'DELIVERED' else 4)
        }
        orders_data.append(ord_doc)

    res_orders = db.orders.insert_many(orders_data)
    print(f"✅ Seeded {len(orders_data)} Orders across all workflow stages.")

    # 8. REVIEWS (10 Verified Reviews)
    reviews_data = [
        {
            "medicine_id": medicine_ids[0], # Augmentin
            "medicine_name": "Augmentin 625 Duo",
            "user_id": demo_user_id,
            "user_name": "Aarav Patel",
            "rating": 5,
            "headline": "Genuine product and fast approval",
            "comment": "Prescription was verified within 10 minutes and medicine arrived in temperature controlled packaging. Excellent service!",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=4)
        },
        {
            "medicine_id": medicine_ids[5], # Dolo 650
            "medicine_name": "Dolo 650",
            "user_id": user_ids[3],
            "user_name": "Priya Sharma",
            "rating": 5,
            "headline": "Must-have home essential",
            "comment": "Works wonders for fever and headache. Got authentic medicines at a great discount compared to local pharmacy.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=8)
        },
        {
            "medicine_id": medicine_ids[11], # Telma 40
            "medicine_name": "Telma 40",
            "user_id": user_ids[4],
            "user_name": "Rohit Verma",
            "rating": 5,
            "headline": "Reliable for monthly BP refill",
            "comment": "I order this monthly for my parents. Long expiry date and genuine Glenmark batch.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=12)
        },
        {
            "medicine_id": medicine_ids[26], # Becosules
            "medicine_name": "Becosules Z Capsules",
            "user_id": user_ids[5],
            "user_name": "Ananya Singh",
            "rating": 5,
            "headline": "Cured mouth ulcers in 3 days",
            "comment": "Best B-complex capsules with zinc. Very affordable and highly effective.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=15)
        },
        {
            "medicine_id": medicine_ids[38], # Digene
            "medicine_name": "Digene Gel Mint Flavour",
            "user_id": user_ids[6],
            "user_name": "Vikram Malhotra",
            "rating": 5,
            "headline": "Instant acidity relief",
            "comment": "Refreshing mint taste and brings acidity down immediately after spicy meals.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=18)
        },
        {
            "medicine_id": medicine_ids[35], # Asthalin
            "medicine_name": "Asthalin Inhaler 100mcg",
            "user_id": user_ids[7],
            "user_name": "Neha Gupta",
            "rating": 5,
            "headline": "Lifesaver inhaler",
            "comment": "Quick relief during sudden wheezing spells. Delivered within 24 hours.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=20)
        },
        {
            "medicine_id": medicine_ids[46], # Refresh tears
            "medicine_name": "Refresh Tears Eye Drops",
            "user_id": user_ids[8],
            "user_name": "Amit Joshi",
            "rating": 5,
            "headline": "Essential for software developers",
            "comment": "I spend 10+ hours staring at monitors. These lubricating drops eliminate eye dryness completely.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=22)
        },
        {
            "medicine_id": medicine_ids[6], # Combiflam
            "medicine_name": "Combiflam",
            "user_id": user_ids[9],
            "user_name": "Kavita Deshmukh",
            "rating": 4,
            "headline": "Great for muscle stiffness",
            "comment": "Relieves severe backache quickly. Always take with meals to avoid stomach irritation.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=25)
        },
        {
            "medicine_id": medicine_ids[21], # Betnovate-N
            "medicine_name": "Betnovate-N Cream",
            "user_id": demo_user_id,
            "user_name": "Aarav Patel",
            "rating": 5,
            "headline": "Effective for skin rash",
            "comment": "Cleared stubborn eczema patch within 4 days of application. Very satisfied.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        },
        {
            "medicine_id": medicine_ids[49], # Dettol
            "medicine_name": "Dettol Antiseptic Liquid",
            "user_id": user_ids[3],
            "user_name": "Priya Sharma",
            "rating": 5,
            "headline": "Original Dettol, great packaging",
            "comment": "Large 550ml bottle securely bubble wrapped. Timely delivery.",
            "is_verified_purchase": True,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=30)
        }
    ]
    db.reviews.insert_many(reviews_data)
    print("✅ Seeded 10 Verified Reviews.")

    # 9. NOTIFICATIONS
    notifications_data = [
        {
            "user_id": demo_user_id,
            "title": "Welcome to MediCare Online Pharmacy! 🎉",
            "message": "Your account has been created. Explore our catalog of 50+ genuine medicines with home delivery.",
            "type": "SYSTEM",
            "is_read": True,
            "link": "/medicines",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=10)
        },
        {
            "user_id": demo_user_id,
            "title": "Prescription Approved ✅",
            "message": "Your prescription by Dr. Vivek Mehra has been verified and approved by the pharmacist.",
            "type": "PRESCRIPTION",
            "is_read": True,
            "link": "/prescriptions",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        },
        {
            "user_id": demo_user_id,
            "title": "Special Weekend Offer! 🏷️",
            "message": "Use coupon code 'PHARMA20' at checkout to get 20% off on orders above ₹800.",
            "type": "PROMOTION",
            "is_read": False,
            "link": "/medicines",
            "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=6)
        }
    ]
    db.notifications.insert_many(notifications_data)
    print("✅ Seeded In-app Notifications.")

    print("\n🎉 MediCare Database Seeding Completed Successfully!")
    print("--------------------------------------------------")
    print("Demo Login Credentials:")
    print("👉 Customer:    user@medicare.com        / Password123!")
    print("👉 Admin:       admin@medicare.com       / Password123!")
    print("👉 Pharmacist:  pharmacist@medicare.com  / Password123!")
    print("--------------------------------------------------")

if __name__ == '__main__':
    seed_database()
