import requests
import json
import os
from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session

load_dotenv()

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow insecure transport for local testing

class WhoopClient:
    def __init__(self):
        self.client_id = os.getenv("WHOOP_CLIENT_ID")
        self.client_secret = os.getenv("WHOOP_CLIENT_SECRET")
        self.base_url = "https://api.prod.whoop.com"
        self.callback_url = os.getenv("WHOOP_CALLBACK_URL")

        self.auth_url = f"{self.base_url}/oauth/oauth2/auth"
        self.token_url = f"{self.base_url}/oauth/oauth2/token"

        self.scope = ['read:workout', 'read:profile']
        self.oauth = None
        self.token = None
        self.auth_response = None

    def get_authorization_url(self):
        try: 
            self.oauth = OAuth2Session(
                self.client_id,
                scope=self.scope,
                redirect_uri=self.callback_url
            )

            auth_url, state = self.oauth.authorization_url(self.auth_url)
            print(f"Visit this URL to authorize: {auth_url}")
            
            self.auth_response = input("Enter the full callback URL after authorization: ")
        except Exception as e:
            print(f"Error during authorization URL generation: {e}")
            


    def get_access_token(self):
        try:
            self.token = self.oauth.fetch_token(
                self.token_url,
                authorization_response=self.auth_response,
                client_secret=self.client_secret,  
                include_client_id=True,
                method='POST'
            )
            # print("Authentication successful!")
            # print("Access Token:", self.token['access_token'])
            # if 'refresh_token' in self.token:
            #     print("Refresh Token:", self.token['refresh_token'])
        except Exception as e:
            print(f"Error during token fetch: {e}")
           

    def get_user_profile(self):
        if not self.token['access_token']:
            print("No access token available. Please authenticate first.")
            return None
        
        url = f"{self.base_url}/developer/v1/user/profile/basic"
        headers = {
            "Authorization": f"Bearer {self.token['access_token']}",
            "Content-Type": "application/json"
        }
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching user profile: {e}")
            return None
        
    def get_user_workout(self):
        if not self.token['access_token']:
            print("No access token available. Please authenticate first.")
            return None
        
        url = f"{self.base_url}/developer/v1/activity/workout"
        headers = {
            "Authorization": f"Bearer {self.token['access_token']}",
            "Content-Type": "application/json"
        }
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching user workout: {e}")
            return None


def main():
    client = WhoopClient()

    client.get_authorization_url()

    client.get_access_token()

    prof = client.get_user_profile()
    #print(prof)

    workout = client.get_user_workout()
    #print(workout)
    
    


if __name__ == "__main__":
    main()
    
