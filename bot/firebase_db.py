"""
Firebase Firestore & Storage Integration for Python Telegram Bot
"""
import os
import uuid
import urllib.parse
import firebase_admin
from firebase_admin import credentials, firestore, storage

KEY_FILENAME = "ecommercytest-firebase-adminsdk-fbsvc-645304f3a0.json"

# Search for service account key file in root or bot dir
key_path = KEY_FILENAME
if not os.path.exists(key_path):
    key_path = os.path.join(os.path.dirname(__file__), "..", KEY_FILENAME)

if not firebase_admin._apps:
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'ecommercytest.firebasestorage.app'
    })

db = firestore.client()
bucket = storage.bucket()


def format_price(amount: int | float) -> str:
    try:
        val = int(amount)
        return f"{val:,}".replace(",", " ") + " so'm"
    except (ValueError, TypeError):
        return f"{amount} so'm"


# ─── Storage Image Upload ─────────────────────────────────────

def upload_image_to_firebase(local_path: str) -> str:
    """Uploads a local image file to Firebase Storage and returns its public URL."""
    try:
        blob_name = f"products/{uuid.uuid4().hex}_{os.path.basename(local_path)}"
        blob = bucket.blob(blob_name)
        blob.upload_from_filename(local_path)
        
        # Standard public Firebase download URL format
        encoded_name = urllib.parse.quote(blob_name, safe='')
        url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{encoded_name}?alt=media"
        print(f"[OK] Uploaded image to Firebase: {url}")
        return url
    except Exception as e:
        print(f"[ERR] Firebase Storage error: {e}")
        return ""


# ─── Products ─────────────────────────────────────────────────

def get_products():
    docs = db.collection("products").get()
    products = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        products.append(d)
    return products


def get_product_by_id(prod_id: str | int):
    doc_ref = db.collection("products").document(str(prod_id))
    doc = doc_ref.get()
    if doc.exists:
        d = doc.to_dict()
        d["id"] = doc.id
        return d
    return None


def add_product(data: dict):
    # Process local images if any and upload to Firebase Storage
    firebase_images = []
    for img in data.get("images", []):
        if img.startswith("http://") or img.startswith("https://"):
            firebase_images.append(img)
        else:
            # Check local images folder
            local_path = os.path.join("images", img)
            if not os.path.exists(local_path):
                local_path = img
            if os.path.exists(local_path):
                public_url = upload_image_to_firebase(local_path)
                if public_url:
                    firebase_images.append(public_url)
                else:
                    firebase_images.append(img)
            else:
                firebase_images.append(img)

    product_id = str(int(uuid.uuid4().int % 1000000))
    product_data = {
        "id": product_id,
        "name": data.get("name", ""),
        "price": data.get("price", 0),
        "oldPrice": data.get("oldPrice"),
        "category": data.get("category", ""),
        "images": firebase_images,
        "rating": 5.0,
        "reviews": 0,
        "sizes": data.get("sizes", []),
        "color": data.get("color", ""),
        "description": data.get("description", ""),
        "discount": data.get("discount", "")
    }

    db.collection("products").document(product_id).set(product_data)
    print(f"[OK] Firebase: Mahsulot saqlandi ({product_data['name']})")
    return product_data


def delete_product(prod_id: str | int):
    db.collection("products").document(str(prod_id)).delete()
    print(f"[DEL] Firebase: Mahsulot o'chirildi ({prod_id})")


# ─── Categories ───────────────────────────────────────────────

def get_categories():
    docs = db.collection("categories").get()
    categories = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        categories.append(d)
    return categories


def get_category_by_id(cat_id: str | int):
    doc_ref = db.collection("categories").document(str(cat_id))
    doc = doc_ref.get()
    if doc.exists:
        d = doc.to_dict()
        d["id"] = doc.id
        return d
    return None


def add_category(name: str):
    cat_id = str(int(uuid.uuid4().int % 100000))
    cat_data = {"id": cat_id, "name": name, "icon": "package"}
    db.collection("categories").document(cat_id).set(cat_data)
    print(f"[OK] Firebase: Kategoriya qo'shildi ({name})")
    return cat_data


def delete_category(cat_id: str | int):
    db.collection("categories").document(str(cat_id)).delete()
    print(f"[DEL] Firebase: Kategoriya o'chirildi ({cat_id})")
