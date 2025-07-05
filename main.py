import requests
import json
import os
from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session

load_dotenv()

class WhoopClient:
    def __init__(self):
        self.client_id = os.getenv("WHOOP_CLIENT_ID"),
        self.client_secret = os.getenv("WHOOP_CLIENT_SECRET"),
        self.base_url = "https://api.prod.whoop.com"
        self.callback_url = os.getenv("WHOOP_CALLBACK_URL")

        self.auth_url = f"{self.base_url}/oauth/oauth2/auth"
        self.token_url = f"{self.base_url}/oauth/oauth2/token"

        self.scope = ['offline', 'read:profile']
        self.oauth = None
        self.token = None

    def get_authorization_url(self):
        self.oauth = OAuth2Session(
            self.client_id[0],
            scope=self.scope,
            redirect_uri=self.callback_url,
            state=True
        )

        auth_url, state = self.oauth.authorization_url(self.auth_url)

        print(f"Please go to {auth_url} and authorize access.")

    def get_access_token(self, username, password):
        tkn_url = f"{self.base_url}/oauth/oauth2/token"

        headers = {
            "grant_type": "password",
            "username": username,
            "password": password,
            "client_id": self.client_id[0],
            "client_secret": self.client_secret[0]
        }

        response = requests.post(tkn_url, headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error getting access token: {response.status_code} - {response.text}")

def main():
    client = WhoopClient()

    client.get_authorization_url()
    
    


if __name__ == "__main__":
    main()
    
