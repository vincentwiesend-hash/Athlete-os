#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AthleteOSAPITester:
    def __init__(self, base_url="https://be1681a7-db2f-4f65-921d-3e7d8c59ddf7.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_email = "admin@athleteos.com"
        self.admin_password = "AthleteOS2026!"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, dict) and len(str(resp_data)) < 200:
                        print(f"   Response: {resp_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw response: {response.text[:200]}")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        if success and isinstance(response, dict):
            self.user_id = response.get('id')
            print(f"   Logged in as: {response.get('email')} (ID: {self.user_id})")
        return success

    def test_auth_me(self):
        """Test auth/me endpoint"""
        return self.run_test("Auth Me", "GET", "auth/me", 200)

    def test_profile(self):
        """Test profile endpoints"""
        # Get profile
        get_success, _ = self.run_test("Get Profile", "GET", "profile", 200)
        
        # Update profile
        update_data = {
            "sport": "Run",
            "goal": "Marathon", 
            "days": 6,
            "goalDate": "2026-10-01"
        }
        update_success, _ = self.run_test("Update Profile", "PUT", "profile", 200, data=update_data)
        
        return get_success and update_success

    def test_strava_endpoints(self):
        """Test Strava integration endpoints"""
        # Test Strava status
        status_success, status_resp = self.run_test("Strava Status", "GET", "strava/status", 200)
        
        # Test Strava activities
        activities_success, activities_resp = self.run_test("Strava Activities", "GET", "strava/activities", 200)
        
        if status_success and isinstance(status_resp, dict):
            connected = status_resp.get('connected', False)
            print(f"   Strava connected: {connected}")
            if connected and isinstance(activities_resp, dict):
                activities = activities_resp.get('activities', [])
                print(f"   Activities found: {len(activities)}")
        
        return status_success and activities_success

    def test_coach_endpoint(self):
        """Test AI Coach endpoint"""
        coach_data = {
            "question": "Was soll ich heute trainieren?",
            "userData": {"sport": "Run", "goal": "Halbmarathon", "days": 5},
            "metrics": {"recovery": 78, "sleep": 82, "hrv": 62},
            "activities": [],
            "latestActivity": None,
            "dayStrain": 45
        }
        
        success, response = self.run_test("AI Coach", "POST", "coach", 200, data=coach_data)
        
        if success and isinstance(response, dict):
            answer = response.get('answer', '')
            print(f"   AI Response length: {len(answer)} chars")
            if len(answer) > 10:
                print(f"   AI Response preview: {answer[:100]}...")
        
        return success

    def test_calendar_plan(self):
        """Test calendar plan generation"""
        plan_data = {
            "userData": {"sport": "Run", "goal": "Halbmarathon", "days": 5},
            "metrics": {"recovery": 78, "sleep": 82, "hrv": 62},
            "activities": [],
            "latestActivity": None,
            "dayStrain": 45
        }
        
        success, response = self.run_test("Calendar Plan Generation", "POST", "calendar-plan", 200, data=plan_data)
        
        if success and isinstance(response, dict):
            plan = response.get('plan', {})
            days = plan.get('days', [])
            print(f"   Plan generated with {len(days)} days")
            if plan.get('weekFocus'):
                print(f"   Week focus: {plan['weekFocus'][:50]}...")
        
        return success

    def test_training_plan(self):
        """Test training plan retrieval"""
        return self.run_test("Get Training Plan", "GET", "training-plan", 200)

    def test_changelog(self):
        """Test changelog endpoint"""
        success, response = self.run_test("Changelog", "GET", "changelog", 200)
        
        if success and isinstance(response, dict):
            changelog = response.get('changelog', [])
            current_version = response.get('currentVersion', '')
            print(f"   Current version: {current_version}")
            print(f"   Changelog entries: {len(changelog)}")
        
        return success

    def test_garmin_status(self):
        """Test Garmin status (prepared endpoint)"""
        return self.run_test("Garmin Status", "GET", "garmin/status", 200)

    def test_logout(self):
        """Test logout"""
        return self.run_test("Logout", "POST", "auth/logout", 200)

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Athlete OS Backend API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   Test time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health),
            ("Admin Login", self.test_admin_login),
            ("Auth Me", self.test_auth_me),
            ("Profile Operations", self.test_profile),
            ("Strava Integration", self.test_strava_endpoints),
            ("AI Coach", self.test_coach_endpoint),
            ("Calendar Plan", self.test_calendar_plan),
            ("Training Plan", self.test_training_plan),
            ("Changelog", self.test_changelog),
            ("Garmin Status", self.test_garmin_status),
            ("Logout", self.test_logout)
        ]
        
        failed_tests = []
        
        for test_name, test_func in tests:
            print(f"\n{'='*50}")
            print(f"🧪 {test_name}")
            print('='*50)
            
            try:
                success = test_func()
                if not success:
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                failed_tests.append(test_name)
        
        # Print summary
        print(f"\n{'='*60}")
        print("📊 TEST SUMMARY")
        print('='*60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if failed_tests:
            print(f"\n❌ Failed test categories:")
            for test in failed_tests:
                print(f"   - {test}")
        else:
            print(f"\n✅ All test categories passed!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AthleteOSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())