import requests
import os
import json
from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session

load_dotenv()

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

class SpotifyClient:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.base_url = "https://accounts.spotify.com"
        self.api_base_url = "https://api.spotify.com/v1"
        self.redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")

        self.auth_url = f"{self.base_url}/authorize"
        self.token_url = f"{self.base_url}/api/token"

        self.scope = ["user-read-recently-played", "user-top-read"]
        self.oauth = None
        self.token = None

    def get_authorization_token(self):
        try:
            self.oauth = OAuth2Session(
                client_id=self.client_id,
                scope=self.scope,
                redirect_uri=self.redirect_uri
            )
            auth_url, state = self.oauth.authorization_url(self.auth_url)
            print(f"Visit this URL to authorize: {auth_url}")

            auth_response = input("Enter the full callback URL after authorization: ")
            self.token = self.oauth.fetch_token(
                self.token_url,
                authorization_response=auth_response, 
                client_secret=self.client_secret,
                include_client_id=True,
                method='POST'
            )
        except Exception as e:
            print(f"Error during authorization: {e}")
            return None
        
    def get_top_artists(self):
        if not self.token['access_token']:
            print("Access token is not available. Please authenticate first.")
            return None
        
        url = f"{self.api_base_url}/me/top/artists"
        headers = {
            "Authorization": f"Bearer {self.token['access_token']}",
            "Content-Type": "application/json"
        }
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching top artists: {e}")
            return None



if __name__ == "__main__":
    client = SpotifyClient()
    client.get_authorization_token()
    artist = client.get_top_artists()
    print(json.dumps(artist, indent=2))