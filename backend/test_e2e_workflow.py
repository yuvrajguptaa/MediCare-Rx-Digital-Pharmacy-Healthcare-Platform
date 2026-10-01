import os
import sys
import json
import requests

# Ensure utf-8 output in Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_step(title):
    print(f"\n{'='*20} {title} {'='*20}")

def run_tests():
    session = requests.Session()

    # 1. Customer Login
    print_step("1. Customer Login")
    login_res = session.post(f"{BASE_URL}/auth/login/", json={
        "email": "user@medicare.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Customer login failed: {login_res.text}"
    customer_token = login_res.json()["tokens"]["access_token"]
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    print("[OK] Customer logged in successfully")

    # 2. Get Medicine, Add to Cart & Place Order
    print_step("2. Get Medicine, Add to Cart & Place Order")
    med_res = session.get(f"{BASE_URL}/medicines/?limit=2")
    assert med_res.status_code == 200, f"Medicines fetch failed: {med_res.text}"
    medicines = med_res.json().get("medicines", [])
    assert len(medicines) > 0, "No medicines available to order"
    
    selected_med = medicines[0]
    print(f"Adding medicine to cart: {selected_med['name']} (ID: {selected_med['_id']}, Price: INR {selected_med.get('selling_price')})")

    add_cart_res = session.post(
        f"{BASE_URL}/cart/",
        json={"medicine_id": selected_med["_id"], "quantity": 2},
        headers=customer_headers
    )
    assert add_cart_res.status_code in [200, 201], f"Add to cart failed: {add_cart_res.text}"
    print("[OK] Medicine added to cart")

    order_payload = {
        "shipping_address": {
            "full_name": "Test Customer",
            "phone": "9876543210",
            "street_address": "Flat 402, Green Valley Apts",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560001",
            "address_type": "HOME"
        },
        "payment_method": "COD"
    }

    create_order_res = session.post(
        f"{BASE_URL}/orders/",
        json=order_payload,
        headers=customer_headers
    )
    assert create_order_res.status_code == 201, f"Create order failed: {create_order_res.text}"
    order_data = create_order_res.json()["order"]
    order_id = order_data["_id"]
    order_number = order_data["order_number"]
    delivery_otp = order_data.get("delivery_otp")
    print(f"[OK] Order created: ID = {order_id}, Number = {order_number}, OTP = {delivery_otp}, Status = {order_data['order_status']}")

    # 3. Admin Login
    print_step("3. Admin Login")
    admin_login_res = session.post(f"{BASE_URL}/auth/login/", json={
        "email": "admin@medicare.com",
        "password": "Password123!"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["tokens"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[OK] Admin logged in successfully")

    # 4. Admin Inspect Order Details
    print_step("4. Admin Inspect Order Details")
    admin_detail_res = session.get(f"{BASE_URL}/admin/orders/{order_id}/", headers=admin_headers)
    assert admin_detail_res.status_code == 200, f"Admin detail failed: {admin_detail_res.text}"
    admin_order = admin_detail_res.json()["order"]
    print(f"[OK] Admin fetched order. Total items: {len(admin_order['items'])}, Status: {admin_order['order_status']}")

    # 5. Admin Packing Workflow
    print_step("5. Admin Pack Items")
    pack_res = session.patch(
        f"{BASE_URL}/admin/orders/{order_id}/packing/",
        json={"item_index": 0, "packed": True},
        headers=admin_headers
    )
    assert pack_res.status_code == 200, f"Packing update failed: {pack_res.text}"
    pack_order = pack_res.json()["order"]
    print(f"[OK] Item 0 packed. Packing status: {pack_order.get('packing_status')}, Order status: {pack_order['order_status']}")

    # 6. Admin Mark Ready For Pickup
    print_step("6. Admin Mark Ready for Pickup")
    ready_res = session.patch(f"{BASE_URL}/admin/orders/{order_id}/mark-ready/", headers=admin_headers)
    assert ready_res.status_code == 200, f"Mark ready failed: {ready_res.text}"
    ready_order = ready_res.json()["order"]
    print(f"[OK] Order marked Ready for Pickup. Status: {ready_order['order_status']}")

    # 7. Admin Fetch Delivery Partners & Assign
    print_step("7. Admin Fetch Delivery Partners & Assign")
    riders_res = session.get(f"{BASE_URL}/admin/delivery-partners/", headers=admin_headers)
    assert riders_res.status_code == 200, f"Riders list failed: {riders_res.text}"
    riders = riders_res.json()["delivery_partners"]
    assert len(riders) > 0, "No delivery partners found"
    selected_rider = riders[0]
    print(f"Assigning to rider: {selected_rider.get('name') or selected_rider.get('full_name')} ({selected_rider['email']})")

    assign_res = session.patch(
        f"{BASE_URL}/admin/orders/{order_id}/assign-delivery/",
        json={"delivery_partner_id": selected_rider["_id"]},
        headers=admin_headers
    )
    assert assign_res.status_code == 200, f"Assign delivery failed: {assign_res.text}"
    assigned_order = assign_res.json()["order"]
    print(f"[OK] Rider assigned. Status: {assigned_order['order_status']}, Rider: {assigned_order['delivery_partner']['name']}")

    # 8. Delivery Partner Login
    print_step("8. Delivery Partner Login")
    rider_login_res = session.post(f"{BASE_URL}/auth/login/", json={
        "email": selected_rider["email"],
        "password": "Password123!"
    })
    assert rider_login_res.status_code == 200, f"Rider login failed: {rider_login_res.text}"
    rider_token = rider_login_res.json()["tokens"]["access_token"]
    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    print("[OK] Delivery partner logged in successfully")

    # 9. Rider Views Assigned Deliveries & Dashboard
    print_step("9. Rider Dashboard & Orders List")
    dash_res = session.get(f"{BASE_URL}/delivery/dashboard/", headers=rider_headers)
    assert dash_res.status_code == 200, f"Rider dashboard failed: {dash_res.text}"
    stats = dash_res.json()["stats"]
    print(f"[OK] Rider KPI stats: Assigned: {stats['assigned']}, Out for delivery: {stats['out_for_delivery']}")

    rider_orders_res = session.get(f"{BASE_URL}/delivery/orders/?filter=ACTIVE", headers=rider_headers)
    assert rider_orders_res.status_code == 200, f"Rider orders list failed: {rider_orders_res.text}"
    rider_orders = rider_orders_res.json()["orders"]
    found = any(o["_id"] == order_id for o in rider_orders)
    assert found, f"Order {order_id} not found in rider's assigned queue"
    print(f"[OK] Order {order_number} confirmed in rider's active queue")

    # 10. Rider Marks Picked Up
    print_step("10. Rider Marks Picked Up")
    pickup_res = session.patch(
        f"{BASE_URL}/delivery/orders/{order_id}/status/",
        json={"status": "PICKED_UP"},
        headers=rider_headers
    )
    assert pickup_res.status_code == 200, f"Pickup update failed: {pickup_res.text}"
    print(f"[OK] Order updated to PICKED_UP")

    # 11. Rider Marks Out For Delivery
    print_step("11. Rider Marks Out for Delivery")
    ofd_res = session.patch(
        f"{BASE_URL}/delivery/orders/{order_id}/status/",
        json={"status": "OUT_FOR_DELIVERY"},
        headers=rider_headers
    )
    assert ofd_res.status_code == 200, f"Out for delivery update failed: {ofd_res.text}"
    print(f"[OK] Order updated to OUT_FOR_DELIVERY")

    # 12. Rider Verifies Doorstep OTP & Marks Delivered
    print_step("12. Rider Verifies Doorstep OTP & Marks Delivered")
    verify_res = session.patch(
        f"{BASE_URL}/delivery/orders/{order_id}/verify-otp/",
        json={"otp": delivery_otp},
        headers=rider_headers
    )
    assert verify_res.status_code == 200, f"Verify OTP failed: {verify_res.text}"
    delivered_order = verify_res.json()["order"]
    assert delivered_order["order_status"] == "DELIVERED", f"Status expected DELIVERED, got {delivered_order['order_status']}"
    print(f"[OK] Doorstep OTP verified. Order status is DELIVERED!")

    # 13. Customer Verification
    print_step("13. Customer Order Tracking Check")
    cust_check_res = session.get(f"{BASE_URL}/orders/{order_id}/", headers=customer_headers)
    assert cust_check_res.status_code == 200, f"Customer check failed: {cust_check_res.text}"
    cust_order = cust_check_res.json()["order"]
    assert cust_order["order_status"] == "DELIVERED", "Customer order status mismatch"
    print(f"[OK] Customer views final delivered status with delivery timestamp {cust_order.get('timestamps', {}).get('delivered_at')}")

    print("\n" + "="*20 + " ALL END-TO-END WORKFLOW TESTS PASSED SUCCESSFULLY! " + "="*20)

if __name__ == "__main__":
    run_tests()
