import requests
import os
import json
from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session
from flask import Flask, request, redirect, jsonify
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)


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

    def get_authorization_url(self):
        self.oauth = OAuth2Session(
            client_id=self.client_id,
            scope=self.scope,
            redirect_uri=self.redirect_uri
        )
        auth_url, state = self.oauth.authorization_url(self.auth_url)
        return auth_url
    
    def get_token_from_code(self, callback_url):
        self.token = self.oauth.fetch_token(
            self.token_url,
            authorization_response=callback_url, 
            client_secret=self.client_secret,
            include_client_id=True,
            method='POST'
        )
        return self.token
    
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

@app.route('/spotify/auth_url')
def get_auth_url():
    client = SpotifyClient()
    auth_url = client.get_authorization_url()
    return jsonify({"auth_url": auth_url})

@app.route('/spotify/callback')
def handle_callback():
    client = SpotifyClient()
    callback_url = request.args.get('url')
    print(f"Callback URL: {callback_url}")
    token = client.get_token_from_code(callback_url)
    return jsonify(token)
@app.route('/')
def home():
    return "Spotify Auth Server is Running"
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)  # Set debug=True for development