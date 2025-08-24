#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Monkey Registry
Tests all CRUD operations and AI description generation endpoints
"""

import requests
import json
import uuid
from datetime import datetime, date
import sys
import os

# Use localhost for testing since we're testing from inside the container
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

print(f"Testing API at: {API_BASE}")

class MonkeyRegistryTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_monkey_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_data': response_data
        })
        
        if not success:
            print(f"   Details: {response_data}")
    
    def test_api_root(self):
        """Test the root API endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/")
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'Monkey Registry API' in data['message']:
                    self.log_test("API Root Endpoint", True, "Root endpoint accessible")
                    return True
                else:
                    self.log_test("API Root Endpoint", False, "Unexpected response format", data)
                    return False
            else:
                self.log_test("API Root Endpoint", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Connection error: {str(e)}")
            return False
    
    def test_get_all_monkeys_empty(self):
        """Test GET /api/monkeys when database might be empty"""
        try:
            response = self.session.get(f"{API_BASE}/monkeys")
            
            if response.status_code == 200:
                # Check if response is valid JSON
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_test("GET All Monkeys (Initial)", True, f"Retrieved {len(data)} monkeys")
                        return True, data
                    else:
                        self.log_test("GET All Monkeys (Initial)", False, "Response is not a list", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("GET All Monkeys (Initial)", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("GET All Monkeys (Initial)", False, f"Status: {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("GET All Monkeys (Initial)", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_create_monkey(self):
        """Test POST /api/monkeys - Create a new monkey"""
        test_monkey = {
            "name": "Charlie",
            "species": "Capuchin",
            "age_years": 5,
            "favourite_fruit": "Banana",
            "last_checkup_at": "2024-01-15"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/monkeys", json=test_monkey)
            
            if response.status_code == 201:
                try:
                    data = response.json()
                    if 'monkey_id' in data and data['name'] == test_monkey['name']:
                        self.test_monkey_id = data['monkey_id']
                        self.log_test("POST Create Monkey", True, f"Created monkey with ID: {self.test_monkey_id}")
                        return True, data
                    else:
                        self.log_test("POST Create Monkey", False, "Missing required fields in response", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("POST Create Monkey", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("POST Create Monkey", False, f"Status: {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("POST Create Monkey", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_get_all_monkeys_with_data(self):
        """Test GET /api/monkeys after creating data"""
        try:
            response = self.session.get(f"{API_BASE}/monkeys")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        # Check if our test monkey is in the list
                        found_test_monkey = any(monkey.get('monkey_id') == self.test_monkey_id for monkey in data)
                        if found_test_monkey:
                            self.log_test("GET All Monkeys (With Data)", True, f"Retrieved {len(data)} monkeys including test monkey")
                            return True, data
                        else:
                            self.log_test("GET All Monkeys (With Data)", False, "Test monkey not found in list", data)
                            return False, None
                    else:
                        self.log_test("GET All Monkeys (With Data)", False, "Empty list or invalid format", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("GET All Monkeys (With Data)", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("GET All Monkeys (With Data)", False, f"Status: {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("GET All Monkeys (With Data)", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_get_specific_monkey(self):
        """Test GET /api/monkeys/{id}"""
        if not self.test_monkey_id:
            self.log_test("GET Specific Monkey", False, "No test monkey ID available")
            return False, None
            
        try:
            response = self.session.get(f"{API_BASE}/monkeys/{self.test_monkey_id}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('monkey_id') == self.test_monkey_id:
                        self.log_test("GET Specific Monkey", True, f"Retrieved monkey: {data.get('name')}")
                        return True, data
                    else:
                        self.log_test("GET Specific Monkey", False, "Monkey ID mismatch", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("GET Specific Monkey", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("GET Specific Monkey", False, f"Status: {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("GET Specific Monkey", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_update_monkey(self):
        """Test PUT /api/monkeys/{id}"""
        if not self.test_monkey_id:
            self.log_test("PUT Update Monkey", False, "No test monkey ID available")
            return False, None
            
        updated_data = {
            "name": "Charlie Updated",
            "species": "Capuchin",
            "age_years": 6,
            "favourite_fruit": "Mango",
            "last_checkup_at": "2024-02-15",
            "description": "Updated test monkey"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/monkeys/{self.test_monkey_id}", json=updated_data)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('name') == updated_data['name'] and data.get('age_years') == updated_data['age_years']:
                        self.log_test("PUT Update Monkey", True, f"Updated monkey: {data.get('name')}")
                        return True, data
                    else:
                        self.log_test("PUT Update Monkey", False, "Update data mismatch", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("PUT Update Monkey", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("PUT Update Monkey", False, f"Status: {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("PUT Update Monkey", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_ai_description_generation(self):
        """Test POST /api/generate-description"""
        test_data = {
            "name": "Charlie",
            "species": "Capuchin",
            "age_years": 5,
            "favourite_fruit": "Banana",
            "last_checkup_at": "2024-01-15"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/generate-description", json=test_data)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'description' in data and 'generated_at' in data:
                        description_length = len(data['description'])
                        self.log_test("POST AI Description", True, f"Generated description ({description_length} chars)")
                        return True, data
                    else:
                        self.log_test("POST AI Description", False, "Missing required fields in response", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("POST AI Description", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("POST AI Description", False, f"Status: {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("POST AI Description", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_validation_errors(self):
        """Test input validation"""
        # Test missing required fields
        invalid_data = {
            "name": "",  # Empty name
            "species": "",  # Empty species
            "age_years": -1,  # Invalid age
            "favourite_fruit": "",  # Empty fruit
            "last_checkup_at": ""  # Empty date
        }
        
        try:
            response = self.session.post(f"{API_BASE}/monkeys", json=invalid_data)
            
            if response.status_code == 400:
                try:
                    data = response.json()
                    if 'errors' in data:
                        self.log_test("Validation Errors", True, f"Correctly rejected invalid data with {len(data['errors'])} errors")
                        return True, data
                    else:
                        self.log_test("Validation Errors", False, "No errors field in response", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("Validation Errors", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("Validation Errors", False, f"Expected 400, got {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("Validation Errors", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_not_found_errors(self):
        """Test 404 errors for non-existent resources"""
        fake_id = str(uuid.uuid4())
        
        try:
            # Test GET non-existent monkey
            response = self.session.get(f"{API_BASE}/monkeys/{fake_id}")
            
            if response.status_code == 404:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_test("404 Error Handling", True, "Correctly returned 404 for non-existent monkey")
                        return True, data
                    else:
                        self.log_test("404 Error Handling", False, "No error field in 404 response", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("404 Error Handling", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("404 Error Handling", False, f"Expected 404, got {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("404 Error Handling", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_delete_monkey(self):
        """Test DELETE /api/monkeys/{id}"""
        if not self.test_monkey_id:
            self.log_test("DELETE Monkey", False, "No test monkey ID available")
            return False, None
            
        try:
            response = self.session.delete(f"{API_BASE}/monkeys/{self.test_monkey_id}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'message' in data:
                        self.log_test("DELETE Monkey", True, "Successfully deleted monkey")
                        
                        # Verify deletion by trying to get the monkey
                        verify_response = self.session.get(f"{API_BASE}/monkeys/{self.test_monkey_id}")
                        if verify_response.status_code == 404:
                            self.log_test("DELETE Verification", True, "Monkey no longer exists after deletion")
                            return True, data
                        else:
                            self.log_test("DELETE Verification", False, "Monkey still exists after deletion")
                            return False, None
                    else:
                        self.log_test("DELETE Monkey", False, "No message field in response", data)
                        return False, None
                except json.JSONDecodeError as e:
                    self.log_test("DELETE Monkey", False, f"JSON parsing error: {str(e)}", response.text)
                    return False, None
            else:
                self.log_test("DELETE Monkey", False, f"Status: {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("DELETE Monkey", False, f"Connection error: {str(e)}")
            return False, None
    
    def test_response_headers(self):
        """Test CORS headers and content type"""
        try:
            response = self.session.get(f"{API_BASE}/monkeys")
            
            # Check CORS headers
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if not missing_headers:
                self.log_test("CORS Headers", True, "All CORS headers present")
            else:
                self.log_test("CORS Headers", False, f"Missing headers: {missing_headers}")
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if 'application/json' in content_type:
                self.log_test("Content Type", True, "Correct JSON content type")
            else:
                self.log_test("Content Type", False, f"Unexpected content type: {content_type}")
                
        except Exception as e:
            self.log_test("Response Headers", False, f"Error checking headers: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("🐒 MONKEY REGISTRY BACKEND API TESTING")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_api_root,
            self.test_get_all_monkeys_empty,
            self.test_create_monkey,
            self.test_get_all_monkeys_with_data,
            self.test_get_specific_monkey,
            self.test_update_monkey,
            self.test_ai_description_generation,
            self.test_validation_errors,
            self.test_not_found_errors,
            self.test_response_headers,
            self.test_delete_monkey  # Delete last to clean up
        ]
        
        for test in tests:
            test()
            print()  # Add spacing between tests
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
            return True
        else:
            print(f"\n⚠️  {total - passed} tests failed. Check the details above.")
            
            # Show failed tests
            failed_tests = [result for result in self.test_results if not result['success']]
            if failed_tests:
                print("\nFailed Tests:")
                for test in failed_tests:
                    print(f"  - {test['test']}: {test['message']}")
            
            return False

def main():
    """Main test execution"""
    tester = MonkeyRegistryTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()