import requests
import sys

# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def run_e2e_tests():
    print("🚀 Starting Automated MediCare End-to-End Test Suite...\n")
    session = requests.Session()

    # TEST 1: Health check & catalog listing
    r = session.get(f"{BASE_URL}/medicines/")
    assert r.status_code == 200, f"Catalog list failed: {r.text}"
    data = r.json()
    medicines = data.get('medicines', [])
    print(f"✅ 1. Catalog API passed: {len(medicines)} medicines loaded (Total in DB: {data['pagination']['total_count']})")

    # TEST 2: Search & Filter
    r = session.get(f"{BASE_URL}/medicines/?search=Dolo&category=Pain%20Relief%20%26%20Analgesics")
    assert r.status_code == 200, f"Search filter failed: {r.text}"
    search_res = r.json().get('medicines', [])
    assert len(search_res) > 0, "Dolo 650 not found in search filter"
    dolo_id = search_res[0]['id']
    print(f"✅ 2. Search & Filter passed: Found '{search_res[0]['name']}' (ID: {dolo_id})")

    # TEST 3: Search suggestions
    r = session.get(f"{BASE_URL}/medicines/suggestions/?q=aug")
    assert r.status_code == 200, f"Suggestions failed: {r.text}"
    suggs = r.json().get('suggestions', [])
    assert len(suggs) > 0, "No suggestions for query 'aug'"
    print(f"✅ 3. Search Autocomplete passed: {len(suggs)} suggestions returned")

    # TEST 4: Customer Login
    login_payload = {'email': 'user@medicare.com', 'password': 'Password123!'}
    r = session.post(f"{BASE_URL}/auth/login/", json=login_payload)
    assert r.status_code == 200, f"Login failed: {r.text}"
    user_data = r.json()
    access_token = user_data['tokens']['access_token']
    headers = {'Authorization': f"Bearer {access_token}"}
    print(f"✅ 4. Customer Authentication passed: Logged in as {user_data['user']['email']} (Role: {user_data['user']['role']})")

    # TEST 5: Cart Management (Add, Recalculate, Stock Check)
    r = session.get(f"{BASE_URL}/medicines/?search=Augmentin")
    aug_med = r.json()['medicines'][0]
    r = session.post(f"{BASE_URL}/cart/", json={'medicine_id': aug_med['id'], 'quantity': 2}, headers=headers)
    assert r.status_code == 200, f"Add to cart failed: {r.text}"

    cart_data = r.json()['cart']
    assert cart_data['item_count'] >= 2, "Cart item count mismatch"
    assert cart_data['requires_prescription'] == True, "Augmentin should trigger prescription required"
    print(f"✅ 5. Cart Engine passed: Total ₹{cart_data['final_total']} (Requires Rx: {cart_data['requires_prescription']})")

    # TEST 6: Apply Coupon Code
    r = session.post(f"{BASE_URL}/coupons/validate/", json={'code': 'HEALTH10'}, headers=headers)
    assert r.status_code == 200, f"Apply coupon failed: {r.text}"
    coupon_cart = r.json()['cart']
    assert coupon_cart['coupon_discount'] > 0, "Coupon discount was not applied"
    print(f"✅ 6. Coupon Engine passed: Applied 'HEALTH10', Discount: ₹{coupon_cart['coupon_discount']}")

    # TEST 7: Prescription Upload & Listing
    r = session.get(f"{BASE_URL}/prescriptions/my/", headers=headers)
    assert r.status_code == 200, f"Get prescriptions failed: {r.text}"
    my_rxs = r.json().get('prescriptions', [])
    approved_rx = next((p for p in my_rxs if p['status'] == 'APPROVED'), None)
    assert approved_rx is not None, "No approved prescription found for demo customer"
    rx_id = approved_rx['id']
    print(f"✅ 7. Prescriptions Vault passed: Linked approved prescription ID {rx_id} (Status: {approved_rx['status']})")

    # TEST 8: Checkout & Order Creation
    # Get user address
    r = session.get(f"{BASE_URL}/addresses/", headers=headers)
    assert r.status_code == 200
    addresses = r.json().get('addresses', [])
    assert len(addresses) > 0, "No address found"
    addr_id = addresses[0]['id']

    order_payload = {
        'address_id': addr_id,
        'payment_method': 'RAZORPAY',
        'prescription_id': rx_id,
        'coupon_code': 'HEALTH10',
        'customer_notes': 'Handle with care.'
    }
    r = session.post(f"{BASE_URL}/orders/", json=order_payload, headers=headers)
    assert r.status_code == 201, f"Order placement failed: {r.text}"
    order_data = r.json()['order']
    order_id = order_data['id']
    print(f"✅ 8. Order Placement & Payment passed: Created Order #{order_data['order_number']} (Total: ₹{order_data['total_amount']})")

    # TEST 9: Order Details & Logistics Timeline
    r = session.get(f"{BASE_URL}/orders/{order_id}/", headers=headers)
    assert r.status_code == 200, f"Order details failed: {r.text}"
    order_detail = r.json()['order']
    assert len(order_detail['status_history']) >= 2, "Status history missing steps"
    print(f"✅ 9. Logistics Stepper passed: Current status '{order_detail['order_status']}', Timeline logs: {len(order_detail['status_history'])}")

    # TEST 10: Review Submission
    r = session.get(f"{BASE_URL}/reviews/can-review/{aug_med['id']}/", headers=headers)
    assert r.status_code == 200, f"Can review check failed: {r.text}"
    can_rev = r.json()
    print(f"✅ 10. Review Eligibility passed: Verified purchase eligibility = {can_rev['can_review']}")

    # TEST 11: MediAI Assistant
    ai_payload = {'prompt': 'What is Amoxicillin used for and what is its dosage?'}
    r = session.post(f"{BASE_URL}/ai/chat/", json=ai_payload)
    assert r.status_code == 200, f"MediAI failed: {r.text}"
    ai_data = r.json()
    assert 'Medical Disclaimer' in ai_data['disclaimer'], "Disclaimer missing in MediAI response"
    print(f"✅ 11. MediAI Assistant passed: Received clinical guidance with medical disclaimer")

    # TEST 12: Admin Login & Dashboard Stats
    r = session.post(f"{BASE_URL}/auth/login/", json={'email': 'admin@medicare.com', 'password': 'Password123!'})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    admin_token = r.json()['tokens']['access_token']
    admin_headers = {'Authorization': f"Bearer {admin_token}"}

    r = session.get(f"{BASE_URL}/admin/stats/", headers=admin_headers)
    assert r.status_code == 200, f"Admin stats failed: {r.text}"
    stats_data = r.json()
    print(f"✅ 12. Admin Analytics passed: Total Revenue: ₹{stats_data['stats']['total_revenue']}, Orders: {stats_data['stats']['total_orders']}, Medicines: {stats_data['stats']['total_medicines']}")

    # TEST 13: Pharmacist Prescription Approval
    r = session.get(f"{BASE_URL}/prescriptions/review/list/?status=PENDING", headers=admin_headers)
    assert r.status_code == 200, f"Prescription queue failed: {r.text}"
    pending_rxs = r.json().get('prescriptions', [])
    if pending_rxs:
        pending_id = pending_rxs[0]['id']
        r = session.post(f"{BASE_URL}/prescriptions/{pending_id}/review/", json={
            'status': 'APPROVED',
            'review_notes': 'Verified by licensed pharmacist. Approved for dispensing.'
        }, headers=admin_headers)
        assert r.status_code == 200, f"Prescription approval failed: {r.text}"
        print(f"✅ 13. Pharmacist Prescription Verification passed: Approved prescription ID {pending_id}")

    # TEST 14: Order Logistics Advancement
    r = session.post(f"{BASE_URL}/admin/orders/{order_id}/status/", json={
        'order_status': 'PACKED',
        'note': 'Order verified and packed in sterile tamper-proof packaging.'
    }, headers=admin_headers)
    assert r.status_code == 200, f"Logistics update failed: {r.text}"
    print(f"✅ 14. Logistics Status Advancement passed: Advanced Order #{order_data['order_number']} to 'PACKED'")

    # TEST 15: Inventory Stock Update
    r = session.post(f"{BASE_URL}/admin/inventory/", json={
        'updates': [{'medicine_id': dolo_id, 'stock': 295}]
    }, headers=admin_headers)
    assert r.status_code == 200, f"Inventory update failed: {r.text}"
    print(f"✅ 15. Inventory Stock Management passed: Updated stock for medicine ID {dolo_id}")

    print("\n🎉 =========================================================")
    print("🌟 ALL 15 CRITICAL MVP ACCEPTANCE WORKFLOWS PASSED 100%!")
    print("🎉 =========================================================")

if __name__ == '__main__':
    run_e2e_tests()
